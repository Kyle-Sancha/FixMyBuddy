const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const isMechanicApiConfigured = Boolean(baseUrl);

async function request(path, { method = 'GET', body, signal } = {}) {
  if (!baseUrl) {
    throw new Error('The mechanic service is not connected yet.');
  }

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();

  signal?.addEventListener('abort', abortFromCaller, { once: true });

  if (signal?.aborted) {
    controller.abort();
  }

  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 204) {
      return null;
    }

    if (response.status === 401) {
      throw new Error('Please sign in to continue.');
    }

    if (response.status === 409) {
      throw new Error('This job has changed. Refresh and try again.');
    }

    if (!response.ok) {
      throw new Error('We could not complete your request. Please try again.');
    }

    return await response.json();
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new Error('The request timed out. Please try again.');
    }

    if (error instanceof TypeError) {
      throw new Error('Check your connection and try again.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

function jobPath(jobId, suffix = '') {
  return `/mechanics/me/jobs/${encodeURIComponent(String(jobId))}${suffix}`;
}

export const mechanicService = {
  async getProfile(signal) {
    const data = await request('/mechanics/me', { signal });
    return data?.mechanic;
  },

  async updateProfile(profile, signal) {
    const data = await request('/mechanics/me/profile', {
      method: 'PATCH',
      body: profile,
      signal,
    });
    return data?.mechanic;
  },

  async updateAvailability(availability, signal) {
    const data = await request('/mechanics/me/availability', {
      method: 'PATCH',
      body: availability,
      signal,
    });
    return data?.availability;
  },

  async getJobs({ status, signal } = {}) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const data = await request(`/mechanics/me/jobs${query}`, { signal });
    return data?.jobs || [];
  },

  async getJob(jobId, signal) {
    const data = await request(jobPath(jobId), { signal });
    return data?.job;
  },

  async acceptJob(jobId, signal) {
    const data = await request(jobPath(jobId, '/accept'), {
      method: 'POST',
      body: {},
      signal,
    });
    return data?.job;
  },

  async declineJob(jobId, reason, signal) {
    const data = await request(jobPath(jobId, '/decline'), {
      method: 'POST',
      body: reason ? { reason } : {},
      signal,
    });
    return data?.job;
  },

  async verifyArrival(jobId, details, signal) {
    const data = await request(jobPath(jobId, '/arrival-verification'), {
      method: 'POST',
      body: details,
      signal,
    });
    return data?.job;
  },

  async submitDiagnosis(jobId, diagnosis, signal) {
    const data = await request(jobPath(jobId, '/diagnosis'), {
      method: 'POST',
      body: diagnosis,
      signal,
    });
    return data?.diagnosis;
  },

  async submitQuote(jobId, quote, signal) {
    const data = await request(jobPath(jobId, '/quotes'), {
      method: 'POST',
      body: quote,
      signal,
    });
    return data?.quote;
  },

  async requestAdditionalWork(jobId, details, signal) {
    const data = await request(jobPath(jobId, '/additional-work'), {
      method: 'POST',
      body: details,
      signal,
    });
    return data?.request;
  },

  async updateJobProgress(jobId, progress, signal) {
    const data = await request(jobPath(jobId, '/progress'), {
      method: 'PATCH',
      body: progress,
      signal,
    });
    return data?.job;
  },

  async completeHandover(jobId, details, signal) {
    const data = await request(jobPath(jobId, '/handover'), {
      method: 'POST',
      body: details,
      signal,
    });
    return data?.job;
  },

  async completeJob(jobId, details = {}, signal) {
    const data = await request(jobPath(jobId, '/completion'), {
      method: 'POST',
      body: details,
      signal,
    });
    return data?.job;
  },

  async getEarnings({ period, signal } = {}) {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    const data = await request(`/mechanics/me/earnings${query}`, { signal });
    return data?.earnings;
  },

  async getUpdates(signal) {
    const data = await request('/mechanics/me/updates', { signal });
    return data?.updates || [];
  },
};