const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const reconciliationTypes = {
  list: () => request('/reconciliation-types'),
  get: (id) => request(`/reconciliation-types/${id}`),
  create: (body) => request('/reconciliation-types', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/reconciliation-types/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/reconciliation-types/${id}`, { method: 'DELETE' }),
};

export const runs = {
  list: () => request('/runs'),
  get: (id) => request(`/runs/${id}`),
  getFull: (id) => request(`/runs/${id}/full`),
  create: (body) => request('/runs', { method: 'POST', body: JSON.stringify(body) }),
  getBreaks: (runId) => request(`/runs/${runId}/breaks`),
};

export const ask = {
  post: (body) => request('/ask', { method: 'POST', body: JSON.stringify(body) }),
};

export const explanations = {
  list: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/explanations${q ? `?${q}` : ''}`);
  },
  accept: (id) => request(`/explanations/${id}/accept`, { method: 'POST' }),
  reject: (id) => request(`/explanations/${id}/reject`, { method: 'POST' }),
};

export const dashboard = {
  metrics: () => request('/dashboard/metrics'),
  runs: (limit = 10) => request(`/dashboard/runs?limit=${limit}`),
};
