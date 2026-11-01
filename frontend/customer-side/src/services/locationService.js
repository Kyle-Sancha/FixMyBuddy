import { formatLocationAddress, validCoordinates } from '../utils/locationAddress';

const endpoint = (import.meta.env.VITE_GEOCODER_URL || 'https://photon.komoot.io').replace(/\/$/, '');
const cache = new Map();
export async function lookupAddress(position) {
  if (!validCoordinates(position)) throw new Error('Choose a valid location.');
  const key = `${position.latitude.toFixed(5)},${position.longitude.toFixed(5)}`;
  if (cache.has(key)) return cache.get(key);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL(`${endpoint}/reverse`);
    url.search = new URLSearchParams({ lat: position.latitude, lon: position.longitude, limit: '1', lang: 'en' });
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Address lookup is unavailable.');
    const data = await response.json();
    const address = formatLocationAddress(data.features?.[0]?.properties);
    if (!address) throw new Error('No address was found for this pin.');
    if (cache.size >= 100) cache.delete(cache.keys().next().value);
    cache.set(key, address);
    return address;
  } finally { clearTimeout(timeout); }
}
