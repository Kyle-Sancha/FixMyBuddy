import { accountRequest } from './accountService';
import { validArrivalPin, validServiceMessage } from '../utils/activeServiceValidation';

const endpoint = id => `/customers/me/bookings/${encodeURIComponent(id)}/mechanic`;
export async function mechanicMessages(id, signal) {
  const data = await accountRequest(`${endpoint(id)}/messages`, { signal });
  if (!Array.isArray(data?.messages) || !data.messages.every(validServiceMessage)) throw new Error('Could not load provider messages.');
  return data.messages;
}
export async function sendMechanicMessage(id, body, clientId) {
  const data = await accountRequest(`${endpoint(id)}/messages`, { method: 'POST', body: { body, clientId } });
  if (!validServiceMessage(data?.message) || data.message.sender !== 'customer' || data.message.body !== body || data.message.clientId !== clientId) throw new Error('Could not confirm your message. Refresh before retrying.');
  return data.message;
}
export async function getArrivalPin(id, signal) {
  const data = await accountRequest(`${endpoint(id)}/arrival-pin`, { signal });
  if (!validArrivalPin(data, id)) throw new Error('Arrival PIN is unavailable or expired. Refresh your service before trying again.');
  return data;
}
