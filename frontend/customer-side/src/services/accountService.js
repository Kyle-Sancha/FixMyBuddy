import { safeSupportContact, validDispute, validSupportMessage } from '../utils/accountValidation';
import { networkFetch } from '../utils/networkFetch';
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const accountApiConfigured = Boolean(baseUrl);
export async function accountRequest(path, { method = 'GET', body, signal } = {}) {
  if (!baseUrl) throw new Error('This service is not connected yet. Nothing has been submitted.');
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, body instanceof FormData ? 120000 : 15000);
  try {
    const multipart = body instanceof FormData;
    const response = await networkFetch(`${baseUrl}${path}`, { method, credentials: 'include', cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json', ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}) });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Please sign in to continue.');
      if (response.status === 409) throw new Error('These details changed. Refresh before trying again.');
      throw new Error('Could not save or load these details. Please try again.');
    }
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error.name === 'AbortError') throw new Error('The request timed out. Check its status before retrying.');
    if (error instanceof TypeError) throw new Error('Check your connection and try again.');
    throw error;
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
}
function messagesFrom(data) {
  if (!Array.isArray(data?.messages) || !data.messages.every(validSupportMessage)) throw new Error('Could not read support messages.');
  return data.messages;
}
export const accountService = {
  async config(signal) {
    const data = await accountRequest('/support/config', { signal });
    return safeSupportContact(data);
  },
  async messages(signal) { return messagesFrom(await accountRequest('/customers/me/support/messages', { signal })); },
  async sendMessage(body, clientId) {
    const data = await accountRequest('/customers/me/support/messages', { method: 'POST', body: { body, clientId } });
    return messagesFrom({ messages: [data?.message] })[0];
  },
  async disputes(signal) {
    const data = await accountRequest('/customers/me/disputes', { signal });
    if (!Array.isArray(data?.disputes) || !data.disputes.every(validDispute)) throw new Error('Could not load your concerns.');
    return data.disputes;
  },
  async createDispute(details, files, clientId) {
    const body = new FormData();
    body.append('details', JSON.stringify({ ...details, clientId }));
    for (const file of files) body.append('evidence', file, file.name);
    const data = await accountRequest('/customers/me/disputes', { method: 'POST', body });
    if (!validDispute(data?.dispute)) throw new Error('Could not confirm submission. Check your concerns before retrying.');
    return data.dispute;
  },
  async sharing(id, enabled, version) {
    const data = await accountRequest(`/customers/me/bookings/${encodeURIComponent(id)}/sharing`, { method: 'PATCH', body: { enabled, version } });
    if (typeof data?.sharing?.enabled !== 'boolean') throw new Error('Could not confirm the sharing setting.');
    return data.sharing;
  },
};

