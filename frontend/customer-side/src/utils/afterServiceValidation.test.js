import assert from 'node:assert/strict';
import { validReview, validClaimAmount, validWarranty } from './afterServiceValidation.js';
const review = { id: 'review', bookingId: 'booking', rating: 5, body: '' };
assert.equal(validReview(review, 'booking'), true);
for (const rating of [0,6,2.5,NaN]) assert.equal(validReview({ ...review, rating }, 'booking'), false);
assert.equal(validReview(review, 'other-booking'), false);
assert.equal(validReview({ ...review, body: 'x'.repeat(2001) }, 'booking'), false);
for (const amount of ['', '0', '0.01', '100.25']) assert.equal(validClaimAmount(amount), true);
for (const amount of ['-1', '1.001', 'NaN', 'Infinity', '1e3', '999999999999999999999']) assert.equal(validClaimAmount(amount), false);
assert.equal(validWarranty({ id: 'w', title: 'Provider coverage', status: 'active' }), true);
assert.equal(validWarranty({ id: 'w', title: 'Provider coverage', status: 'active', exclusions: {} }), false);
assert.equal(validWarranty(null), false);
console.log('Review eligibility data, warranty records and optional refund amount checks passed.');

