import process from 'node:process';
import { Router } from 'express';
import { query, withTransaction } from '../db/pool.js';
import {
  generateNumericCode,
  generateOpaqueToken,
  hashPassword,
  hashToken,
  verifyPassword,
  verifyTokenHash,
} from '../utils/crypto.js';
import { isEmail, normalizePhone } from '../utils/validation.js';
import {
  clearSession,
  createRateLimiter,
  createSession,
  formatUser,
} from '../middleware/security.js';

export const authRouter = Router();

const authLimiter = createRateLimiter({ windowMs: 60_000, max: 15 });
const otpLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_MS = 60 * 1000; // 60 seconds

function logDevOtp(phone, code) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV SMS] OTP for ${phone}: ${code}`);
  }
}

// GET /auth/session
authRouter.get('/session', (req, res) => {
  res.json({ user: req.user || null });
});

// POST /auth/logout
authRouter.post('/logout', async (req, res) => {
  await clearSession(req, res);
  res.status(204).end();
});

// POST /auth/signup
authRouter.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      acceptedTerms,
      role = 'customer',
    } = req.body || {};

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const accountRole = role === 'mechanic' ? 'mechanic' : 'customer';

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Enter your full name.' });
    }
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Enter a valid Philippine mobile number.' });
    }
    if (!isEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 8 || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Use at least 8 characters, including a number.' });
    }
    if (acceptedTerms !== true) {
      return res.status(400).json({ error: 'Please accept the Terms and Privacy Policy.' });
    }

    const existing = await query(
      `SELECT id FROM users WHERE lower(email) = $1 OR phone = $2 LIMIT 1`,
      [cleanEmail, cleanPhone],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with these details already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const otpCode = generateNumericCode(6);
    const codeHash = hashToken(otpCode);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const resendAt = new Date(Date.now() + OTP_RESEND_MS);

    const challengeRes = await query(
      `INSERT INTO phone_challenges (
         phone, flow, code_hash, pending_signup, expires_at, resend_at
       )
       VALUES ($1, 'signup', $2, $3::jsonb, $4, $5)
       RETURNING id, expires_at, resend_at`,
      [
        cleanPhone,
        codeHash,
        JSON.stringify({
          role: accountRole,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash,
          acceptedTerms: true,
        }),
        expiresAt.toISOString(),
        resendAt.toISOString(),
      ],
    );

    logDevOtp(cleanPhone, otpCode);

    const row = challengeRes.rows[0];
    return res.status(201).json({
      challenge: {
        id: String(row.id),
        expiresAt: new Date(row.expires_at).toISOString(),
        resendAt: new Date(row.resend_at).toISOString(),
        ...(process.env.NODE_ENV !== 'production' ? { devCode: otpCode } : {}),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// POST /auth/login
authRouter.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!isEmail(cleanEmail) || typeof password !== 'string' || !password) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const userRes = await query(
      `SELECT * FROM users WHERE lower(email) = $1 LIMIT 1`,
      [cleanEmail],
    );
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const userRow = userRes.rows[0];
    const valid = await verifyPassword(password, userRow.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (role && userRow.role !== role && userRow.role !== 'admin') {
      return res.status(403).json({
        error: `This account is registered as a ${userRow.role}, not a ${role}.`,
      });
    }

    const user = formatUser(userRow);
    await createSession(res, req, user);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

// POST /auth/phone/start
authRouter.post('/phone/start', otpLimiter, async (req, res, next) => {
  try {
    const cleanPhone = normalizePhone(req.body?.phone);
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Enter a valid Philippine mobile number.' });
    }

    const userRes = await query(
      `SELECT id FROM users WHERE phone = $1 LIMIT 1`,
      [cleanPhone],
    );
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'No account found for that mobile number.' });
    }

    const otpCode = generateNumericCode(6);
    const codeHash = hashToken(otpCode);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const resendAt = new Date(Date.now() + OTP_RESEND_MS);

    const challengeRes = await query(
      `INSERT INTO phone_challenges (user_id, phone, flow, code_hash, expires_at, resend_at)
       VALUES ($1, $2, 'login', $3, $4, $5)
       RETURNING id, expires_at, resend_at`,
      [
        userRes.rows[0].id,
        cleanPhone,
        codeHash,
        expiresAt.toISOString(),
        resendAt.toISOString(),
      ],
    );

    logDevOtp(cleanPhone, otpCode);

    const row = challengeRes.rows[0];
    return res.json({
      challenge: {
        id: String(row.id),
        expiresAt: new Date(row.expires_at).toISOString(),
        resendAt: new Date(row.resend_at).toISOString(),
        ...(process.env.NODE_ENV !== 'production' ? { devCode: otpCode } : {}),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// POST /auth/phone/verify
authRouter.post('/phone/verify', otpLimiter, async (req, res, next) => {
  try {
    const { challengeId, code } = req.body || {};
    const cleanCode = typeof code === 'string' ? code.replace(/\D/g, '') : '';
    if (!challengeId || cleanCode.length !== 6) {
      return res.status(401).json({ error: 'Invalid verification code.' });
    }

    const challengeRes = await query(
      `SELECT * FROM phone_challenges WHERE id = $1 LIMIT 1`,
      [challengeId],
    );
    if (challengeRes.rows.length === 0) {
      return res.status(401).json({ error: 'Verification session not found.' });
    }

    const challenge = challengeRes.rows[0];
    if (
      challenge.verified_at ||
      challenge.attempts >= 5 ||
      new Date(challenge.expires_at).getTime() <= Date.now()
    ) {
      return res.status(401).json({ error: 'Verification code expired or locked.' });
    }

    // In development mode, allow '123456' alongside the generated OTP so mobile flows can be tested without SMS gateway
    const isDevBypass =
      process.env.NODE_ENV !== 'production' && cleanCode === '123456';
    const matches = isDevBypass || verifyTokenHash(cleanCode, challenge.code_hash);

    if (!matches) {
      await query(
        `UPDATE phone_challenges SET attempts = attempts + 1 WHERE id = $1`,
        [challenge.id],
      );
      return res.status(401).json({ error: 'Incorrect verification code.' });
    }

    const userRow = await withTransaction(async (client) => {
      await client.query(
        `UPDATE phone_challenges SET verified_at = NOW() WHERE id = $1`,
        [challenge.id],
      );

      if (challenge.flow === 'signup' && challenge.pending_signup) {
        const pending = challenge.pending_signup;
        const created = await client.query(
          `INSERT INTO users (
             role, name, email, phone, phone_verified, password_hash,
             accepted_terms, accepted_terms_at
           )
           VALUES ($1, $2, $3, $4, TRUE, $5, TRUE, NOW())
           ON CONFLICT (email) DO UPDATE SET phone_verified = TRUE
           RETURNING *`,
          [
            pending.role || 'customer',
            pending.name,
            pending.email,
            pending.phone,
            pending.passwordHash,
          ],
        );
        const newUser = created.rows[0];
        if (newUser.role === 'mechanic') {
          const proId = `PRO-${String(Math.floor(1000 + Math.random() * 9000))}`;
          await client.query(
            `INSERT INTO mechanic_profiles (id, user_id, display_name, verified, online)
             VALUES ($1, $2, $3, FALSE, FALSE)
             ON CONFLICT (user_id) DO NOTHING`,
            [proId, newUser.id, newUser.name],
          );
        }
        return newUser;
      }

      const updated = await client.query(
        `UPDATE users SET phone_verified = TRUE, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [challenge.user_id],
      );
      return updated.rows[0];
    });

    if (!userRow) {
      return res.status(401).json({ error: 'Account could not be verified.' });
    }

    const user = formatUser(userRow);
    await createSession(res, req, user);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

// POST /auth/phone/resend
authRouter.post('/phone/resend', otpLimiter, async (req, res, next) => {
  try {
    const { challengeId } = req.body || {};
    if (!challengeId) {
      return res.status(400).json({ error: 'Challenge ID is required.' });
    }

    const challengeRes = await query(
      `SELECT * FROM phone_challenges WHERE id = $1 LIMIT 1`,
      [challengeId],
    );
    if (challengeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    const current = challengeRes.rows[0];
    if (
      process.env.NODE_ENV === 'production' &&
      new Date(current.resend_at).getTime() > Date.now()
    ) {
      return res.status(429).json({ error: 'Please wait before requesting a new code.' });
    }

    const otpCode = generateNumericCode(6);
    const codeHash = hashToken(otpCode);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const resendAt = new Date(Date.now() + OTP_RESEND_MS);

    const updated = await query(
      `UPDATE phone_challenges
       SET code_hash = $1, attempts = 0, expires_at = $2, resend_at = $3
       WHERE id = $4
       RETURNING id, expires_at, resend_at`,
      [codeHash, expiresAt.toISOString(), resendAt.toISOString(), current.id],
    );

    logDevOtp(current.phone, otpCode);

    const row = updated.rows[0];
    return res.json({
      challenge: {
        id: String(row.id),
        expiresAt: new Date(row.expires_at).toISOString(),
        resendAt: new Date(row.resend_at).toISOString(),
        ...(process.env.NODE_ENV !== 'production' ? { devCode: otpCode } : {}),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// POST /auth/password/forgot
authRouter.post('/password/forgot', authLimiter, async (req, res, next) => {
  try {
    const cleanEmail = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

    if (isEmail(cleanEmail)) {
      const userRes = await query(
        `SELECT id FROM users WHERE lower(email) = $1 LIMIT 1`,
        [cleanEmail],
      );
      if (userRes.rows.length > 0) {
        const rawResetToken = generateOpaqueToken(24);
        await query(
          `INSERT INTO password_resets (user_id, token_hash, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
          [userRes.rows[0].id, hashToken(rawResetToken)],
        );
      }
    }
    // Always return generic response regardless of whether email exists
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});
