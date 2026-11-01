export const conditionKeys = ['starts', 'rolls', 'collision'];
export function validTowingCondition(value) {
  return Boolean(value && conditionKeys.every(key => ['yes','no','unknown'].includes(value[key])));
}
export function validTowingQuote(quote) {
  return Boolean(typeof quote?.routeId === 'string' && quote.routeId && (Number.isFinite(quote.version) || (typeof quote.version === 'string' && quote.version)) && Number.isFinite(quote.distanceKm) && quote.distanceKm >= 0 && typeof quote.pickupAddress === 'string' && quote.pickupAddress.trim() && typeof quote.destinationAddress === 'string' && quote.destinationAddress.trim() && typeof quote.equipment === 'string' && quote.equipment.trim());
}
export function validPosition(position) {
  return Boolean(Number.isFinite(position?.latitude) && Math.abs(position.latitude) <= 90 && Number.isFinite(position.longitude) && Math.abs(position.longitude) <= 180);
}
export function validHandoverInput(value, requiresPin) {
  return Boolean(value && ['no_new_damage','damage_reported'].includes(value.condition) && value.vehicleReceived === true && value.keysReceived === true && (value.condition !== 'damage_reported' || (typeof value.damageNotes === 'string' && value.damageNotes.trim().length >= 10)) && (!requiresPin || (typeof value.pin === 'string' && value.pin.trim())));
}
export function handoverAvailable(booking) {
  return booking.serviceType === 'towing' && !['cancelled','rejected'].includes(booking.status) && booking.towing?.status === 'at_destination' && booking.towing?.canConfirmHandover === true && booking.towing?.handover?.status !== 'confirmed';
}

