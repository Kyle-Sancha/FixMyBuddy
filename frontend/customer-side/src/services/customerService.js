const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
import { networkFetch } from '../utils/networkFetch';
import { canDecideQuote, validQuoteDecision } from '../utils/quoteValidation';
import { validReview } from '../utils/afterServiceValidation';
import { accountRequest } from './accountService';
import { handoverAvailable, validHandoverInput } from '../utils/towingValidation';
export const isCustomerApiConfigured = Boolean(baseUrl);

async function request(path, method = 'GET', body) {
  if (!baseUrl)
    throw new Error(
      'Service is currently unavailable. Please try again later.',
    );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await networkFetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      if (response.status === 401)
        throw new Error('Please sign in to continue.');
      if (response.status === 409)
        throw new Error('These details have changed. Refresh and try again.');
      throw new Error('We could not complete your request. Please try again.');
    }
    if (response.status === 204) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError')
      throw new Error('The request timed out. Please try again.');
    if (error instanceof TypeError)
      throw new Error('Check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function records(data, key) {
  if (
    !Array.isArray(data?.[key]) ||
    !data[key].every((item) => item && typeof item === 'object' && item.id)
  )
    throw new Error('We could not load your details. Please try again.');
  return data[key];
}

export const customerService = {
  async confirmHandover(booking, details, files) {
    if (!handoverAvailable(booking) || !validHandoverInput(details, booking.towing?.handover?.requiresPin === true)) throw new Error('Review the handover checks before confirming.');
    const body = new FormData();
    body.append('details', JSON.stringify({ ...details, bookingVersion: booking.version }));
    for (const file of files) body.append('evidence', file, file.name);
    const data = await accountRequest(`/customers/me/bookings/${encodeURIComponent(booking.id)}/towing/handover`, { method: 'POST', body });
    const saved = data?.handover;
    if (typeof saved?.id !== 'string' || !saved.id || saved.status !== 'confirmed' || saved.condition !== details.condition || saved.keysReceived !== true || saved.vehicleReceived !== true || (details.condition === 'damage_reported' && saved.damageNotes !== details.damageNotes)) throw new Error('Could not confirm handover. Refresh before retrying.');
    return saved;
  },
  async towingMessages(id, signal) {
    const data = await accountRequest(`/customers/me/bookings/${encodeURIComponent(id)}/towing/messages`, { signal });
    if (!Array.isArray(data?.messages) || !data.messages.every(item => typeof item?.id === 'string' && item.id && typeof item.body === 'string' && ['customer','provider'].includes(item.sender))) throw new Error('Could not load provider messages.');
    return data.messages;
  },
  async sendTowingMessage(id, body, clientId) {
    const data = await accountRequest(`/customers/me/bookings/${encodeURIComponent(id)}/towing/messages`, { method: 'POST', body: { body, clientId } });
    if (typeof data?.message?.id !== 'string' || !data.message.id || data.message.sender !== 'customer' || typeof data.message.body !== 'string') throw new Error('Could not confirm your message. Refresh before retrying.');
    return data.message;
  },
  async saveReview(id, details) {
    const data = await request(`/customers/me/bookings/${encodeURIComponent(id)}/review`, 'PUT', details);
    if (!validReview(data?.review, id)) throw new Error('Could not confirm the saved review. Refresh before retrying.');
    return data.review;
  },
  async decideQuote(booking, quote, decision) {
    if (!['approve','reject'].includes(decision) || !canDecideQuote(booking, quote)) throw new Error('This quote is no longer available for a decision. Refresh the booking.');
    const data = await request(`/customers/me/bookings/${encodeURIComponent(booking.id)}/quote-decision`, 'POST', {
      quoteId: quote.id, quoteVersion: quote.version, decision,
      approvedQuoteId: booking.approvedQuote?.id || null,
      approvedQuoteVersion: booking.approvedQuote?.version ?? null,
      bookingVersion: booking.version,
    });
    if (!validQuoteDecision(data, booking, quote, decision)) throw new Error('Could not confirm this quote decision. Refresh before retrying.');
    return data.booking;
  },
  async requestInspection(id, version) {
    const data = await request(`/customers/me/bookings/${encodeURIComponent(id)}/inspection-request`, 'POST', { version });
    if (data?.booking?.id !== id || data.booking.inspectionStatus !== 'requested') throw new Error('Could not confirm the inspection request. Refresh before retrying.');
    return data.booking;
  },
  async reminders() {
    return records(await request('/customers/me/reminders'), 'reminders');
  },
  async saveReminder(details, id) {
    const data = await request(`/customers/me/reminders${id ? '/' + encodeURIComponent(id) : ''}`, id ? 'PATCH' : 'POST', details);
    if (!data?.reminder?.id) throw new Error('Could not confirm the reminder was saved.');
    return data.reminder;
  },
  async removeReminder(id) {
    await request(`/customers/me/reminders/${encodeURIComponent(id)}`, 'DELETE');
  },
  async markUpdatesRead(ids) {
    const data = await request('/customers/me/updates/read', 'POST', { ids });
    if (!Array.isArray(data?.readIds) || !data.readIds.every(id => typeof id === 'string')) throw new Error('Could not confirm which notifications were marked read.');
    return data.readIds;
  },
  async manageBooking(id, action, details) {
    if (!['cancel', 'reschedule'].includes(action)) throw new Error('Invalid booking action.');
    const data = await request(`/customers/me/bookings/${encodeURIComponent(id)}/${action}`, 'POST', details);
    if (data?.booking?.id !== id || (action === 'cancel' && data.booking.status !== 'cancelled') || (action === 'reschedule' && !Number.isFinite(Date.parse(data.booking.scheduledAt)))) throw new Error('Could not confirm the booking change. Refresh before retrying.');
    return data.booking;
  },
  async receipt(id) {
    if (!baseUrl) throw new Error('Receipt service is not connected.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await networkFetch(`${baseUrl}/customers/me/bookings/${encodeURIComponent(id)}/receipt`, { credentials: 'include', signal: controller.signal, headers: { Accept: 'application/pdf' } });
      if (!response.ok || !response.headers.get('Content-Type')?.includes('application/pdf')) throw new Error('The verified receipt could not be loaded.');
      const blob = await response.blob();
      if (!blob.size) throw new Error('The receipt is empty. Please try again.');
      return blob;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Receipt request timed out. Please try again.');
      throw error;
    } finally { clearTimeout(timeout); }
  },
  async reportPayment(id, details) {
    return request(`/customers/me/bookings/${encodeURIComponent(id)}/payment-reports`, 'POST', details);
  },
  async approveRepairs(id, details) {
    const data = await request(`/customers/me/bookings/${encodeURIComponent(id)}/repair-approval`, 'POST', details);
    if (data?.booking?.repairApprovalStatus !== 'approved') throw new Error('Could not confirm repair approval. Refresh before retrying.');
    return data.booking;
  },
  async removeVehicle(id) {
    await request(`/customers/me/vehicles/${encodeURIComponent(id)}`, 'DELETE');
  },
  async vehicles() {
    return records(await request('/customers/me/vehicles'), 'vehicles');
  },
  async saveVehicle(vehicle, id) {
    const data = await request(
      `/customers/me/vehicles${id ? `/${encodeURIComponent(id)}` : ''}`,
      id ? 'PATCH' : 'POST',
      vehicle,
    );
    if (!data?.vehicle?.id)
      throw new Error('We could not save your vehicle. Please try again.');
    return data.vehicle;
  },
  async bookings() {
    return records(await request('/customers/me/bookings'), 'bookings');
  },
  async updates() {
    return records(await request('/customers/me/updates'), 'updates');
  },
  async createBooking(details) {
    const data = await request('/customers/me/bookings', 'POST', details);
    if (!data?.booking?.id)
      throw new Error(
        'We could not confirm the booking. Please check your history before retrying.',
      );
    return data.booking;
  },
};
