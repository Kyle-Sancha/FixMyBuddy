export const defaultProviderFilters = {
  radiusKm: 5, specialty: '', minimumRating: 0, verifiedOnly: false,
  maximumVisitPrice: '', sort: 'eta',
};
export function validateFilters(filters) {
  if (!Number.isFinite(Number(filters.radiusKm)) || Number(filters.radiusKm) < 1 || Number(filters.radiusKm) > 30) return 'Choose a search radius from 1 to 30 km.';
  if (filters.maximumVisitPrice !== '' && (!Number.isFinite(Number(filters.maximumVisitPrice)) || Number(filters.maximumVisitPrice) < 0)) return 'Enter a valid maximum visit price.';
  return '';
}
export function validEstimate(estimate) {
  return Boolean(typeof estimate?.id === 'string' && estimate.id.trim() &&
    ((typeof estimate.version === 'string' && estimate.version.length > 0) || Number.isFinite(estimate.version)) && estimate.currency === 'PHP' &&
    Array.isArray(estimate.items) && estimate.items.length &&
    estimate.items.every(item => item && typeof item.label === 'string' && Number.isFinite(item.amount) && item.amount >= 0) &&
    Number.isFinite(estimate.total) && estimate.total >= 0 &&
    Math.abs(estimate.items.reduce((sum, item) => sum + item.amount, 0) - estimate.total) < 0.01 &&
    (!estimate.expiresAt || (Number.isFinite(Date.parse(estimate.expiresAt)) && Date.parse(estimate.expiresAt) > Date.now())));
}
export function safeMediaUrl(value) {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
export function filterCount(filters) {
  return Number(filters.radiusKm !== 5) + Number(Boolean(filters.specialty)) +
    Number(filters.minimumRating > 0) + Number(filters.verifiedOnly) +
    Number(filters.maximumVisitPrice !== '');
}
export function isProviderRecord(provider) {
  return Boolean(provider && typeof provider.id === 'string' && provider.id && typeof provider.name === 'string' && provider.name.trim() &&
    ['specialties', 'credentials'].every(key => provider[key] === undefined || (Array.isArray(provider[key]) && provider[key].every(item => typeof item === 'string'))) &&
    (provider.cancellationPolicy == null || (typeof provider.cancellationPolicy.id === 'string' && typeof provider.cancellationPolicy.text === 'string')) &&
    (provider.customerReviews === undefined || (Array.isArray(provider.customerReviews) && provider.customerReviews.every(review => review && typeof review.text === 'string' && (review.authorName === undefined || typeof review.authorName === 'string')))));
}

