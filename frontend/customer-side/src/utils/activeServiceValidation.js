export function validServiceMessage(item) {
  return Boolean(typeof item?.id === 'string' && item.id.trim() && typeof item.body === 'string' && item.body.trim() && ['customer', 'provider'].includes(item.sender));
}
export function validArrivalPin(data, bookingId, now = Date.now()) {
  return Boolean(data?.bookingId === bookingId && typeof data.pin === 'string' && /^[A-Za-z0-9-]{4,12}$/.test(data.pin) && Number.isFinite(Date.parse(data.expiresAt)) && Date.parse(data.expiresAt) > now);
}
export function validServiceStep(step) {
  return Boolean(typeof step?.id === 'string' && step.id && typeof step.label === 'string' && step.label.trim() && ['completed', 'current', 'upcoming'].includes(step.status));
}
export function validServiceUpdate(item) {
  return Boolean(typeof item?.id === 'string' && item.id && typeof item.title === 'string' && item.title.trim() && (item.body == null || typeof item.body === 'string'));
}
