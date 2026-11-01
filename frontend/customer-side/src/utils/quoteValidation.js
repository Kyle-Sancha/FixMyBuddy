import { validEstimate } from './bookingValidation.js';
export function validStoredQuote(quote) {
  return validEstimate(quote ? { ...quote, expiresAt: null } : null);
}
export function pendingRepairQuote(booking) {
  if (booking.revisionStatus === 'awaiting_customer') return booking.pendingRevision || null;
  return booking.repairApprovalStatus === 'awaiting_customer' ? booking.repairEstimate || null : null;
}
export function canDecideQuote(booking, quote) {
  if (!validEstimate(quote) || ['cancelled','rejected','completed'].includes(booking.status)) return false;
  if (booking.revisionStatus === 'awaiting_customer') return validStoredQuote(booking.approvedQuote) && quote.baseQuoteId === booking.approvedQuote.id && quote.baseQuoteVersion === booking.approvedQuote.version;
  return booking.repairApprovalStatus === 'awaiting_customer';
}
export function sameQuote(first, second) {
  return validStoredQuote(first) && validStoredQuote(second) && first.id === second.id && first.version === second.version && first.total === second.total && JSON.stringify(first.items) === JSON.stringify(second.items);
}
export function validQuoteDecision(data, booking, quote, decision) {
  if (!['approve','reject'].includes(decision) || data?.booking?.id !== booking.id || data?.decision?.quoteId !== quote.id || data.decision.quoteVersion !== quote.version || data.decision.decision !== decision) return false;
  const status = booking.revisionStatus === 'awaiting_customer' ? data.booking.revisionStatus : data.booking.repairApprovalStatus;
  if (status !== (decision === 'approve' ? 'approved' : 'rejected')) return false;
  if (decision === 'approve') return sameQuote(data.booking.approvedQuote, quote);
  return booking.approvedQuote ? sameQuote(data.booking.approvedQuote, booking.approvedQuote) : data.booking.approvedQuote == null;
}

