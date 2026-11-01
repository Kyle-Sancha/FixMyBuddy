const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
import { networkFetch } from '../utils/networkFetch';

export const isAuthConfigured = Boolean(baseUrl);

async function request(path, body, method = 'POST') {
  if (!baseUrl) {
    throw new Error(
      'Account services are not available yet. Please try again later. You can still browse FixMyBuddy.',
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await networkFetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const messages = {
        401: 'Those details could not be verified. Please check and try again.',
        409: 'An account with these details already exists. Please sign in.',
        429: 'Too many attempts. Please wait before trying again.',
      };
      throw new Error(
        messages[response.status] ||
          'We could not complete your request. Please try again.',
      );
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError')
      throw new Error('The request timed out. Please try again.');
    if (error instanceof TypeError)
      throw new Error(
        'Cannot connect right now. Check your connection and try again.',
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function challengeFrom(data) {
  if (
    !data?.challenge?.id ||
    !Number.isFinite(Date.parse(data.challenge.expiresAt)) ||
    !Number.isFinite(Date.parse(data.challenge.resendAt))
  ) {
    throw new Error('We could not start verification. Please try again.');
  }
  return data.challenge;
}

function userFrom(data) {
  if (!data?.user?.id)
    throw new Error('We could not confirm your session. Please sign in again.');
  return data.user;
}

export const authService = {
  async logout() { await request('/auth/logout', {}, 'POST'); },
  async session() {
    const data = await request('/auth/session', null, 'GET');
    return data?.user?.id ? data.user : null;
  },
  async phone(phone) {
    return challengeFrom(await request('/auth/phone/start', { phone }));
  },
  async signup(details) {
    return challengeFrom(await request('/auth/signup', details));
  },
  async login(email, password) {
    return userFrom(await request('/auth/login', { email, password }));
  },
  async verify(challengeId, code) {
    const user = userFrom(
      await request('/auth/phone/verify', { challengeId, code }),
    );
    if (user.phoneVerified !== true)
      throw new Error(
        'Your phone number has not been verified. Please try again.',
      );
    return user;
  },
  async resend(challengeId) {
    return challengeFrom(await request('/auth/phone/resend', { challengeId }));
  },
  async reset(email) {
    await request('/auth/password/forgot', { email });
  },
  async profile(details) {
    return userFrom(await request('/customers/me', details, 'PATCH'));
  },
};
