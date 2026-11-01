import assert from 'node:assert/strict';
import { canDecideQuote, validQuoteDecision, validStoredQuote } from './quoteValidation.js';
const base = { id: 'base', version: 1, currency: 'PHP', items: [{ label: 'Test scope', amount: 100 }], total: 100 };
const revision = { id: 'revision', version: 2, baseQuoteId: 'base', baseQuoteVersion: 1, currency: 'PHP', items: [{ label: 'Test scope', amount: 100 }, { label: 'Test extra', amount: 20 }], total: 120 };
const booking = { id: 'booking', status: 'in_progress', revisionStatus: 'awaiting_customer', approvedQuote: base };
assert.equal(canDecideQuote(booking, revision), true);
assert.equal(canDecideQuote(booking, { ...revision, baseQuoteVersion: 0 }), false);
assert.equal(canDecideQuote(booking, { ...revision, expiresAt: '2000-01-01' }), false);
assert.equal(validStoredQuote({ ...base, expiresAt: '2000-01-01' }), true);
const reject = { booking: { ...booking, revisionStatus: 'rejected' }, decision: { quoteId: 'revision', quoteVersion: 2, decision: 'reject' } };
assert.equal(validQuoteDecision(reject, booking, revision, 'reject'), true);
assert.equal(validQuoteDecision({ ...reject, booking: { ...reject.booking, approvedQuote: revision } }, booking, revision, 'reject'), false);
const approve = { booking: { ...booking, revisionStatus: 'approved', approvedQuote: revision }, decision: { quoteId: 'revision', quoteVersion: 2, decision: 'approve' } };
assert.equal(validQuoteDecision(approve, booking, revision, 'approve'), true);
assert.equal(validQuoteDecision({ ...approve, decision: { ...approve.decision, quoteVersion: 1 } }, booking, revision, 'approve'), false);
assert.equal(validQuoteDecision({ ...reject, booking }, booking, revision, 'reject'), false);
assert.equal(canDecideQuote({ ...booking, status: 'completed' }, revision), false);
console.log('Quote version, expiry, approval and unchanged-scope rejection checks passed.');

