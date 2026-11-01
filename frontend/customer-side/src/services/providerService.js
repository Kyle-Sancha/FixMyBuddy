import { isProviderRecord } from '../utils/bookingValidation';
import { networkFetch } from '../utils/networkFetch';
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const isProviderApiConfigured = Boolean(baseUrl);

async function providerRequest(path, body, signal) {
  if (!baseUrl) throw new Error('Provider search is not connected yet. No booking has been made.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await networkFetch(`${baseUrl}${path}`, {
      method: body ? 'POST' : 'GET', credentials: 'include', signal: controller.signal,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 401) throw new Error('Please sign in before finding a provider.');
    if (!response.ok) throw new Error('Could not load providers. Please try again.');
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error.name === 'AbortError') throw new Error('Provider search timed out. Please try again.');
    if (error instanceof TypeError) throw new Error('Check your connection and try again.');
    throw error;
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
export async function searchProviders(details, signal) {
  const data = await providerRequest('/providers/search', details, signal);
  if (!Array.isArray(data?.providers) || !data.providers.every(isProviderRecord)) throw new Error('Provider results could not be read. Please try again.');
  return data;
}
export async function getProvider(id, details, signal) {
  const data = await providerRequest(`/providers/${encodeURIComponent(id)}/quote`, details, signal);
  if (!isProviderRecord(data?.provider) || String(data.provider.id) !== String(id)) throw new Error('This provider profile could not be read.');
  return data.provider;
}

