export function validSupportMessage(item) {
  return Boolean(typeof item?.id === 'string' && item.id.trim() && typeof item.body === 'string' && item.body.trim() && ['customer','support'].includes(item.sender));
}
export function validDispute(item) {
  return Boolean(typeof item?.id === 'string' && item.id.trim() && typeof item.subject === 'string' && item.subject.trim() && typeof item.status === 'string' && item.status.trim());
}
export function safeSupportContact(data) {
  return {
    phone: typeof data?.phone === 'string' && /^\+?[0-9 ()-]{5,25}$/.test(data.phone) ? data.phone : '',
    email: typeof data?.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) && !/[\r\n]/.test(data.email) ? data.email : '',
  };
}
