export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCoordinate(value, directionPositive, directionNegative) {
  const direction = value >= 0 ? directionPositive : directionNegative;
  return `${Math.abs(value).toFixed(4)}°${direction}`;
}

