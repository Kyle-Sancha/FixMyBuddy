export function normalizePhone(value) {
  if (typeof value !== 'string' || !/^\+?[\d\s()-]+$/.test(value.trim()))
    return null;
  const digits = value.replace(/\D/g, '');
  if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
  if (/^9\d{9}$/.test(digits)) return `+63${digits}`;
  if (/^639\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function maskPhone(value = '') {
  return value.length > 6
    ? `${value.slice(0, 3)} \u2022\u2022\u2022 \u2022\u2022\u2022 ${value.slice(-4)}`
    : value;
}
