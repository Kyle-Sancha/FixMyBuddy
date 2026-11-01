export function validReview(review, bookingId) {
  return Boolean(typeof review?.id === 'string' && review.id && review.bookingId === bookingId && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 && typeof review.body === 'string' && review.body.length <= 2000);
}
export function validClaimAmount(value) {
  return value === '' || (typeof value === 'string' && /^\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value)) && Number(value) >= 0 && Number.isSafeInteger(Math.round(Number(value) * 100)));
}
export function validWarranty(item) {
  return Boolean(typeof item?.id === 'string' && item.id && typeof item.title === 'string' && typeof item.status === 'string' && ['coverage','exclusions'].every(key => item[key] == null || typeof item[key] === 'string'));
}

