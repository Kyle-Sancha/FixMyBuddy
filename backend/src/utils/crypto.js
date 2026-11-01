import crypto from 'node:crypto';
import process from 'node:process';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
};

function getPepper() {
  return process.env.PASSWORD_PEPPER || 'fixmybuddy-default-pepper-change-in-prod';
}

/**
 * Hashes a plaintext password using scrypt with a random 16-byte salt and server pepper.
 * Output format: scrypt$N$r$p$saltHex$derivedKeyHex
 */
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  const salt = crypto.randomBytes(16);
  const derivedKey = await scryptAsync(
    `${password}:${getPepper()}`,
    salt,
    SCRYPT_PARAMS.keylen,
    {
      N: SCRYPT_PARAMS.N,
      r: SCRYPT_PARAMS.r,
      p: SCRYPT_PARAMS.p,
    },
  );
  return [
    'scrypt',
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString('hex'),
    Buffer.from(derivedKey).toString('hex'),
  ].join('$');
}

/**
 * Verifies a plaintext password against a stored scrypt hash using constant-time comparison.
 */
export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, nStr, rStr, pStr, saltHex, keyHex] = parts;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }
  const salt = Buffer.from(saltHex, 'hex');
  const expectedKey = Buffer.from(keyHex, 'hex');
  if (!salt.length || !expectedKey.length) {
    return false;
  }
  const derivedKey = await scryptAsync(
    `${password}:${getPepper()}`,
    salt,
    expectedKey.length,
    { N, r, p },
  );
  const actualKey = Buffer.from(derivedKey);
  if (actualKey.length !== expectedKey.length) {
    return false;
  }
  return crypto.timingSafeEqual(actualKey, expectedKey);
}

/**
 * Generates a cryptographically strong opaque token (32 bytes = 64 hex chars).
 */
export function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hashes a session token, OTP code, or PIN with SHA-256 + HMAC secret so raw secrets
 * are never stored in plain text in the database.
 */
export function hashToken(token) {
  const secret = process.env.SESSION_SECRET || 'fixmybuddy-session-secret-change-in-prod';
  return crypto
    .createHmac('sha256', secret)
    .update(String(token))
    .digest('hex');
}

/**
 * Constant-time comparison of a candidate token/OTP/PIN against its stored HMAC hash.
 */
export function verifyTokenHash(candidate, expectedHash) {
  if (!candidate || typeof expectedHash !== 'string') return false;
  const candidateHash = Buffer.from(hashToken(candidate), 'hex');
  const storedBuffer = Buffer.from(expectedHash, 'hex');
  if (candidateHash.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(candidateHash, storedBuffer);
}

/**
 * Generates a numeric code of the requested length (e.g. 6 digits for OTP, 4 digits for PIN).
 */
export function generateNumericCode(length = 6) {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  return String(crypto.randomInt(min, max));
}
