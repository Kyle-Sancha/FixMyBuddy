import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateNumericCode,
  generateOpaqueToken,
  hashPassword,
  hashToken,
  verifyPassword,
  verifyTokenHash,
} from './crypto.js';
import { requireAuth } from '../middleware/security.js';
import { haversineKm, isEmail, normalizePhone, normalizedPlateKey } from './validation.js';

test('scrypt password hashing produces salted hashes and verifies accurately', async () => {
  const hash1 = await hashPassword('Roadside#2026');
  const hash2 = await hashPassword('Roadside#2026');

  // Unique random salt per hash
  assert.notEqual(hash1, hash2);
  assert.ok(hash1.startsWith('scrypt$16384$8$1$'));

  // Correct password verifies
  assert.equal(await verifyPassword('Roadside#2026', hash1), true);
  assert.equal(await verifyPassword('Roadside#2026', hash2), true);

  // Wrong password or tampered hash fails
  assert.equal(await verifyPassword('WrongPass123', hash1), false);
  assert.equal(await verifyPassword('Roadside#2026', `${hash1.slice(0, -2)}00`), false);
});

test('HMAC token and PIN hashing never stores plaintext and verifies in constant time', () => {
  const token = generateOpaqueToken(32);
  assert.equal(token.length, 64);

  const hashed = hashToken(token);
  assert.notEqual(hashed, token);
  assert.equal(verifyTokenHash(token, hashed), true);
  assert.equal(verifyTokenHash('wrong-token', hashed), false);

  const pin = generateNumericCode(4);
  assert.match(pin, /^\d{4}$/);
  assert.equal(verifyTokenHash(pin, hashToken(pin)), true);
});

test('requireAuth enforces authentication and role-based isolation between customer and mechanic', () => {
  const customerOnly = requireAuth(['customer']);
  const mechanicOnly = requireAuth(['mechanic']);

  const mockRes = () => {
    const res = {
      statusCode: 200,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.payload = data;
        return this;
      },
    };
    return res;
  };

  // Unauthenticated guest -> 401
  let nextCalled = false;
  const res1 = mockRes();
  customerOnly({ user: null }, res1, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res1.statusCode, 401);

  // Customer accessing mechanic endpoint -> 403 Forbidden
  const res2 = mockRes();
  mechanicOnly({ user: { id: 'u1', role: 'customer' } }, res2, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res2.statusCode, 403);
  assert.equal(res2.payload.requiredRole, 'mechanic');

  // Mechanic accessing customer endpoint -> 403 Forbidden
  const res3 = mockRes();
  customerOnly({ user: { id: 'u2', role: 'mechanic' } }, res3, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res3.statusCode, 403);

  // Mechanic accessing mechanic endpoint -> allowed
  const res4 = mockRes();
  mechanicOnly({ user: { id: 'u2', role: 'mechanic' } }, res4, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test('phone, email, plate and distance helpers validate accurately', () => {
  assert.equal(normalizePhone('0917 123 4567'), '+639171234567');
  assert.equal(normalizePhone('+639171234567'), '+639171234567');
  assert.equal(normalizePhone('invalid'), null);
  assert.equal(isEmail('alex@example.com'), true);
  assert.equal(normalizedPlateKey('abc - 1234'), 'ABC1234');
  assert.ok(haversineKm(13.6218, 123.1948, 13.6185, 123.1895) > 0);
});
