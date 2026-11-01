import process from 'node:process';
import { query } from '../db/pool.js';
import { generateOpaqueToken, hashToken } from '../utils/crypto.js';

export const SESSION_COOKIE_NAME = 'fmb_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function parseCookies(cookieHeader = '') {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  for (const pair of cookieHeader.split(';')) {
    const index = pair.indexOf('=');
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const rawVal = pair.slice(index + 1).trim();
    try {
      cookies[key] = decodeURIComponent(rawVal);
    } catch {
      cookies[key] = rawVal;
    }
  }
  return cookies;
}

export function formatUser(row) {
  if (!row) return null;
  const hasContact = Boolean(
    row.emergency_contact_name &&
      row.emergency_contact_phone &&
      row.emergency_contact_relationship,
  );
  return {
    id: String(row.id),
    role: row.role || 'customer',
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    phoneVerified: Boolean(row.phone_verified),
    emergencyContact: hasContact
      ? {
          name: row.emergency_contact_name,
          phone: row.emergency_contact_phone,
          relationship: row.emergency_contact_relationship,
        }
      : null,
  };
}

export async function createSession(res, req, user) {
  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await query(
    `INSERT INTO auth_sessions (user_id, token_hash, role, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      user.id,
      tokenHash,
      user.role || 'customer',
      req.ip || req.socket?.remoteAddress || null,
      req.headers['user-agent'] || null,
      expiresAt.toISOString(),
    ],
  );

  const isProd = process.env.NODE_ENV === 'production';
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(rawToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (isProd) cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));

  return rawToken;
}

export async function clearSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const rawToken = cookies[SESSION_COOKIE_NAME];
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await query(
      `UPDATE auth_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    ).catch(() => {});
  }
  const isProd = process.env.NODE_ENV === 'production';
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isProd) cookieParts.push('Secure');
  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

/**
 * Attaches `req.user` and `req.mechanicProfile` if a valid session cookie is present.
 */
export async function attachSession(req, _res, next) {
  req.user = null;
  req.mechanicProfile = null;
  const cookies = parseCookies(req.headers.cookie);
  const rawToken = cookies[SESSION_COOKIE_NAME];
  if (!rawToken) return next();

  try {
    const tokenHash = hashToken(rawToken);
    const result = await query(
      `SELECT u.*, s.id AS session_id
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );
    if (result.rows.length > 0) {
      const row = result.rows[0];
      req.user = formatUser(row);
      if (req.user.role === 'mechanic' || req.user.role === 'admin') {
        const mechRes = await query(
          `SELECT * FROM mechanic_profiles WHERE user_id = $1 LIMIT 1`,
          [row.id],
        );
        req.mechanicProfile = mechRes.rows[0] || null;
      }
    }
  } catch {
    // Database not yet migrated or temporarily unreachable; treat as guest
  }
  return next();
}

/**
 * Requires an authenticated session. Optionally enforces allowed account roles
 * (e.g. `requireAuth(['customer'])` or `requireAuth(['mechanic'])`) so logged-in
 * accounts cannot access or mutate another role's or another user's endpoints.
 */
export function requireAuth(allowedRoles = null) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    if (
      Array.isArray(allowedRoles) &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(req.user.role) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        error: `Access denied. This resource requires a ${allowedRoles.join(' or ')} account.`,
        requiredRole: allowedRoles[0],
        currentRole: req.user.role,
      });
    }
    return next();
  };
}

/**
 * Security headers + Origin/CSRF protection for cookie-authenticated state-changing requests.
 */
export function securityHeadersAndCsrf(allowedOriginsOrFn) {
  const isAllowed =
    typeof allowedOriginsOrFn === 'function'
      ? allowedOriginsOrFn
      : (origin) => allowedOriginsOrFn.has(origin);

  return (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    if (unsafeMethod) {
      const origin = req.headers.origin;
      if (origin && !isAllowed(origin)) {
        return res.status(403).json({ error: 'Cross-origin state mutation blocked.' });
      }
    }
    return next();
  };
}

/**
 * In-memory sliding-window rate limiter for sensitive endpoints (login, OTP, PIN verification).
 */
export function createRateLimiter({ windowMs = 60_000, max = 15 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip || 'local'}:${req.baseUrl}${req.path}`;
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many attempts. Please wait before trying again.' });
    }
    return next();
  };
}
