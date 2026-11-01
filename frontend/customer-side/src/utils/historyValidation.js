export const terminalStatuses = new Set(['completed', 'cancelled', 'rejected']);
export function canManageBooking(booking, action) {
  return ['cancel', 'reschedule'].includes(action) && ['requested', 'pending', 'confirmed', 'accepted', 'scheduled'].includes(booking.status) &&
    !booking.dispatchedAt && booking[action === 'cancel' ? 'canCancel' : 'canReschedule'] === true &&
    typeof booking.cancellationPolicy?.id === 'string' && Boolean(booking.cancellationPolicy.id.trim()) && typeof booking.cancellationPolicy?.text === 'string' && Boolean(booking.cancellationPolicy.text.trim());
}
export function hasReceipt(booking) {
  return booking.payment?.status === 'verified' && booking.receiptAvailable === true;
}
export function todayInManila(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = name => parts.find(item => item.type === name).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function validateReminder(fields) {
  if (!fields.title?.trim()) return 'Enter a reminder title.';
  if (!fields.vehicleId) return 'Choose a vehicle.';
  if (!fields.dueDate && (fields.targetMileage === '' || fields.targetMileage == null)) return 'Add a due date or target mileage.';
  if (fields.dueDate) {
    const date = new Date(`${fields.dueDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.dueDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== fields.dueDate) return 'Choose a valid due date.';
  }
  for (const key of ['targetMileage', 'currentMileage']) {
    if (fields[key] !== '' && fields[key] != null && (!Number.isFinite(Number(fields[key])) || Number(fields[key]) < 0)) return 'Mileage must be zero or a positive number.';
  }
  return '';
}
export function reminderDue(reminder, today = todayInManila()) {
  if (reminder.completedAt) return 'Completed';
  const mileageDue = reminder.targetMileage !== '' && reminder.targetMileage != null && reminder.currentMileage !== '' && reminder.currentMileage != null && Number(reminder.currentMileage) >= Number(reminder.targetMileage);
  if (mileageDue || (reminder.dueDate && reminder.dueDate <= today)) return 'Due now';
  return reminder.dueDate ? `Due ${reminder.dueDate}` : `At ${Number(reminder.targetMileage).toLocaleString()} km`;
}

