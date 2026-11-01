import { networkFetch } from '../utils/networkFetch';
import { isRepairShop } from '../utils/towingDestination';

const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const isRepairShopApiConfigured = Boolean(baseUrl);

export async function searchRepairShops(details, signal) {
  if (!baseUrl) throw new Error('Repair shop search is not connected yet. You can enter a destination instead.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await networkFetch(`${baseUrl}/repair-shops/search`, {
      method: 'POST', credentials: 'include', signal: controller.signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    if ([404, 501, 503].includes(response.status)) throw new Error('Repair shop search is unavailable. You can enter a destination instead.');
    if (response.status === 401) throw new Error('Please sign in before searching for repair shops.');
    if (!response.ok) throw new Error('Could not load repair shops. Please try again.');
    const data = await response.json();
    if (!Array.isArray(data?.shops) || !data.shops.every(isRepairShop)) throw new Error('Repair shop results could not be read. Please try again.');
    return data.shops.map(shop => ({ id: shop.id, name: shop.name.trim(), address: shop.address.trim(), ...(shop.latitude != null ? { latitude: shop.latitude, longitude: shop.longitude } : {}), ...(shop.distanceKm != null ? { distanceKm: shop.distanceKm } : {}) }));
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error.name === 'AbortError') throw new Error('Repair shop search timed out. Please try again.');
    if (error instanceof TypeError) throw new Error('Check your connection and try again.');
    throw error;
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
