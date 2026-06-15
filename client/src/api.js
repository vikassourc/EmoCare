// Centralised API client — mirrors the existing public/js/api.js but for React
const BASE = '';

// Auth endpoints that legitimately return 401 for bad credentials (not session expiry)
const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/signup', '/api/auth/google'];

const req = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('emocare_token');
  const config = {
    method,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  };
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) config.body = JSON.stringify(data);

  const res = await fetch(`${BASE}${endpoint}`, config);

  // Only treat 401 as "session expired" on protected routes (not login/signup)
  if (res.status === 401 && !AUTH_ENDPOINTS.includes(endpoint)) {
    localStorage.removeItem('emocare_token');
    localStorage.removeItem('emocare_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (res.status === 204) return { success: true };

  const result = await res.json();
  if (!res.ok) throw new Error(result.message || result.error || 'Request failed');
  return result;
};

export const api = {
  // Auth
  signup:         (d) => req('POST', '/api/auth/signup', d),
  login:          (d) => req('POST', '/api/auth/login', d),
  googleAuth:     (d) => req('POST', '/api/auth/google', d),
  getMe:          ()  => req('GET',  '/api/auth/me'),
  updateProfile:  (d) => req('PUT',  '/api/auth/profile', d),
  updateContacts: (d) => req('PUT',  '/api/auth/profile/contacts', d),
  sendSOS:        ()  => req('POST', '/api/auth/sos'),

  // Chat
  getSessions:    ()  => req('GET',  `/api/chat/sessions?t=${Date.now()}`),
  getSession:     (id)=> req('GET',  `/api/chat/sessions/${id}?t=${Date.now()}`),
  createSession:  (d) => req('POST', '/api/chat/sessions', d),
  deleteSession:  (id)=> req('DELETE',`/api/chat/sessions/${id}`),
  sendMessage:    (d) => req('POST', '/api/chat/send', d),

  // Journal
  getEntries:     (p=1,l=20)=> req('GET', `/api/journal?page=${p}&limit=${l}`),
  createEntry:    (d) => req('POST', '/api/journal', d),
  deleteEntry:    (id)=> req('DELETE',`/api/journal/${id}`),
  getPrompt:      ()  => req('POST', '/api/journal/prompt'),
  getFeedback:    (id)=> req('POST', `/api/journal/${id}/feedback`),

  // Dashboard
  getDashStats:   ()  => req('GET',  '/api/dashboard/stats'),
  getMoodChart:   ()  => req('GET',  '/api/dashboard/mood-chart'),
  getTriggers:    ()  => req('GET',  '/api/dashboard/triggers'),
  getRecommendations: () => req('GET', '/api/dashboard/recommendations'),

  // Mood
  createMood:     (d) => req('POST', '/api/mood', d),
};

export const getUser  = () => { try { return JSON.parse(localStorage.getItem('emocare_user')); } catch { return null; } };
export const getToken = () => localStorage.getItem('emocare_token');
export const setAuth  = (token, user) => {
  localStorage.setItem('emocare_token', token);
  localStorage.setItem('emocare_user', JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem('emocare_token');
  localStorage.removeItem('emocare_user');
};
