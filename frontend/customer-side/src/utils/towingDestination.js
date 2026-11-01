import { validPosition, validTowingCondition } from './towingValidation.js';

export function isRepairShop(shop) {
  return Boolean(shop && typeof shop.id === 'string' && shop.id.trim() && typeof shop.name === 'string' && shop.name.trim() && typeof shop.address === 'string' && shop.address.trim().length >= 5 &&
    ((shop.latitude == null && shop.longitude == null) || validPosition(shop)) &&
    (shop.distanceKm == null || Number.isFinite(shop.distanceKm) && shop.distanceKm >= 0));
}

export function validateTowingDestination(request, location) {
  if (!validPosition(location) && (!location?.address || location.address === 'Use current location' || location.address.trim().length < 5)) return 'Use GPS or enter a full pickup address.';
  if (typeof request.destination !== 'string' || request.destination.trim().length < 5) return 'Enter a full towing destination.';
  if (request.destinationMode === 'nearby' && (!isRepairShop(request.destinationShop) || request.destinationShop.address !== request.destination)) return 'Choose a repair shop from the search results or enter your own destination.';
  if (!validTowingCondition(request.towingCondition)) return 'Answer all towing vehicle-condition questions.';
  return '';
}
