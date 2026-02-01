const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

const AUTH_LOGOUT_EVENT = 'auth:session-expired';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export function onSessionExpired(callback) {
  const handler = () => callback();
  window.addEventListener(AUTH_LOGOUT_EVENT, handler);
  return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
}

export const auth = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password, name) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  me: () => request('/auth/me'),
};

export const clubs = {
  list: () => request('/clubs'),
  get: (id) => request(`/clubs/${id}`),
  create: (body) => request('/clubs', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/clubs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => request(`/clubs/${id}`, { method: 'DELETE' }),
  join: (id) => request(`/clubs/${id}/join`, { method: 'POST' }),
  leave: (id) => request(`/clubs/${id}/leave`, { method: 'POST' }),
};

export const events = {
  list: (params) => request('/events' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  get: (id) => request(`/events/${id}`),
  create: (body) => request('/events', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  approve: (id, status) => request(`/events/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  qr: (id) => request(`/events/${id}/qr`),
  attend: (id, qr_data) => request(`/events/${id}/attend`, { method: 'POST', body: JSON.stringify({ qr_data }) }),
};

export const registrations = {
  my: () => request('/registrations/my'),
  register: (eventId) => request(`/registrations/events/${eventId}`, { method: 'POST' }),
  unregister: (eventId) => request(`/registrations/events/${eventId}`, { method: 'DELETE' }),
  list: (eventId) => request(`/registrations/events/${eventId}/list`),
};

export const analytics = {
  dashboard: () => request('/analytics/dashboard'),
  participation: () => request('/analytics/participation'),
};

export const certificates = {
  participation: (userId) => window.open(BASE.replace('/api', '') + `/api/certificates/participation/${userId}?token=${getToken()}`, '_blank'),
  event: (eventId) => window.open(BASE.replace('/api', '') + `/api/certificates/event/${eventId}?token=${getToken()}`, '_blank'),
};

export const reports = {
  semester: (start, end) => window.open(`/api/reports/semester?start=${start}&end=${end}&token=${getToken()}`, '_blank'),
  portfolio: (userId) => window.open(`/api/reports/student-portfolio/${userId}?token=${getToken()}`, '_blank'),
};

export const users = {
  list: (params) => request('/users' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  setRole: (id, role, club_id) => request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role, club_id }) }),
  create: (body) => request('/users', { method: 'POST', body: JSON.stringify(body) }),
};

export const uploads = {
  list: (clubId) => request(`/uploads/club/${clubId}`),
  upload: (clubId, file, type, event_id) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    if (event_id) fd.append('event_id', event_id);
    return fetch(BASE + `/uploads/${clubId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    }).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); return d; });
  },
};
