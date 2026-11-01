import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLocationAddress, hasStreetAddress, validCoordinates } from './locationAddress.js';
test('pin validation rejects empty, nonnumeric and out-of-range coordinates', () => {
  for (const value of [null, {}, { latitude: null, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }]) assert.equal(validCoordinates(value), false);
  assert.equal(validCoordinates({ latitude: 0, longitude: 0 }), true);
});
test('address formatting retains the returned street and city, without inventing missing data', () => {
  assert.equal(formatLocationAddress({ housenumber: '42', street: 'Test Street', city: 'Test City', country: 'Test Country' }), '42 Test Street, Test City, Test Country');
  assert.equal(formatLocationAddress(null), '');
  assert.equal(formatLocationAddress({ name: 12, city: 'Test City' }), 'Test City');
  assert.equal(hasStreetAddress('Current GPS location'), false);
  assert.equal(hasStreetAddress('42 Test Street, Test City'), true);
});
