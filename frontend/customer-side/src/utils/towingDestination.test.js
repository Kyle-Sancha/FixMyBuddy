import assert from 'node:assert/strict';
import { isRepairShop, validateTowingDestination } from './towingDestination.js';

const shop = { id: 'qa-shop', name: 'QA shop', address: 'QA destination address', latitude: 13.6, longitude: 123.2 };
assert.equal(isRepairShop(shop), true);
assert.equal(isRepairShop({ ...shop, latitude: 91 }), false);
assert.equal(isRepairShop({ ...shop, longitude: null }), false);
assert.equal(isRepairShop({ ...shop, distanceKm: -1 }), false);
assert.equal(isRepairShop({ id: 'qa', name: 'QA', address: 'QA full address' }), true);
const request = { destination: shop.address, destinationMode: 'manual', towingCondition: { starts: 'no', rolls: 'yes', collision: 'unknown' } };
const location = { address: 'QA full pickup address' };
assert.equal(validateTowingDestination(request, location), '');
assert.equal(validateTowingDestination(request, { address: 'Use current location' }), 'Use GPS or enter a full pickup address.');
assert.equal(validateTowingDestination(request, { latitude: 13.6, longitude: 123.2 }), '');
assert.equal(validateTowingDestination({ ...request, destinationMode: 'nearby' }, location), 'Choose a repair shop from the search results or enter your own destination.');
assert.equal(validateTowingDestination({ ...request, destinationMode: 'nearby', destinationShop: shop }, location), '');
assert.notEqual(validateTowingDestination({ ...request, destinationMode: 'nearby', destinationShop: { ...shop, address: 'different address' } }, location), '');
assert.notEqual(validateTowingDestination({ ...request, towingCondition: { starts: 'yes' } }, location), '');
