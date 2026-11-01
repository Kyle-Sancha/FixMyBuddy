export function validCoordinates(position) {
  return Number.isFinite(position?.latitude) && Math.abs(position.latitude) <= 90 && Number.isFinite(position?.longitude) && Math.abs(position.longitude) <= 180;
}
export function hasStreetAddress(address) {
  return typeof address === 'string' && address.trim().length >= 5 && !['Use current location', 'Current GPS location', 'Selected coordinates', 'Selected map pin'].includes(address.trim());
}
export function formatLocationAddress(properties) {
  if (!properties || typeof properties !== 'object') return '';
  const part = key => typeof properties[key] === 'string' ? properties[key].trim() : '';
  const street = [part('housenumber'), part('street')].filter(Boolean).join(' ');
  return [...new Set([part('name'), street, part('district'), part('city') || part('town') || part('village'), part('county'), part('state'), part('postcode'), part('country')].filter(Boolean))].join(', ');
}
