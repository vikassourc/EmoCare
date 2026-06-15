/**
 * EmoCare Centralized API Client
 * Handles all backend communication with JWT auth
 * Auto-redirects to login on 401 responses
 */

const API = {
  baseUrl: '',

  // ── Token Management ──────────────────────────────────────
  getToken() {
    return localStorage.getItem('emocare_token');
  },

  setToken(token) {
    localStorage.setItem('emocare_token', token);
  },

  removeToken() {
    localStorage.removeItem('emocare_token');
    localStorage.removeItem('emocare_user');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('emocare_user'));
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('emocare_user', JSON.stringify(user));
  },

  // ── Core Request Method ───────────────────────────────────
  async request(method, endpoint, data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const token = this.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      // Handle 401 — session expired
      if (response.status === 401) {
        this.removeToken();
        window.location.href = '/login.html';
        throw new Error('Session expired. Please log in again.');
      }

      // Handle no-content responses
      if (response.status === 204) {
        return { success: true };
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Request failed');
      }

      return result;
    } catch (err) {
      // Re-throw API errors, wrap network errors
      if (err.message === 'Session expired. Please log in again.') throw err;
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw err;
    }
  },

  // ── HTTP Method Shortcuts ─────────────────────────────────
  get(endpoint) {
    return this.request('GET', endpoint);
  },

  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  },

  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  },

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  },

  // ── Auth Endpoints ────────────────────────────────────────
  signup(data) {
    return this.post('/api/auth/signup', data);
  },

  login(data) {
    return this.post('/api/auth/login', data);
  },

  googleLogin(credential) {
    return this.post('/api/auth/google', { credential });
  },

  getMe() {
    return this.get('/api/auth/me');
  },

  updateProfile(data) {
    return this.put('/api/auth/profile', data);
  },

  changePassword(data) {
    return this.put('/api/auth/change-password', data);
  },

  deleteAccount() {
    return this.delete('/api/auth/account');
  },

  // ── Chat Endpoints ────────────────────────────────────────
  sendChatMessage(data) {
    return this.post('/api/chat/send', data);
  },

  getChatSessions() {
    return this.get('/api/chat/sessions');
  },

  getChatSession(id) {
    return this.get(`/api/chat/sessions/${id}`);
  },

  createChatSession() {
    return this.post('/api/chat/sessions');
  },

  deleteChatSession(id) {
    return this.delete(`/api/chat/sessions/${id}`);
  },

  // ── Journal Endpoints ─────────────────────────────────────
  getJournalEntries(page = 1, limit = 20) {
    return this.get(`/api/journal?page=${page}&limit=${limit}`);
  },

  getJournalEntry(id) {
    return this.get(`/api/journal/${id}`);
  },

  createJournalEntry(data) {
    return this.post('/api/journal', data);
  },

  updateJournalEntry(id, data) {
    return this.put(`/api/journal/${id}`, data);
  },

  deleteJournalEntry(id) {
    return this.delete(`/api/journal/${id}`);
  },

  getJournalPrompt() {
    return this.post('/api/journal/prompt');
  },

  getJournalFeedback(id) {
    return this.post(`/api/journal/${id}/feedback`);
  },

  // ── Mood Endpoints ────────────────────────────────────────
  getMoodEntries(from, to) {
    let q = '/api/mood';
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) q += '?' + params.join('&');
    return this.get(q);
  },

  createMoodEntry(data) {
    return this.post('/api/mood', data);
  },

  getMoodStats() {
    return this.get('/api/mood/stats');
  },

  // ── Dashboard Endpoints ───────────────────────────────────
  getDashboardStats() {
    return this.get('/api/dashboard/stats');
  },

  getMoodChart() {
    return this.get('/api/dashboard/mood-chart');
  },

  getTriggers() {
    return this.get('/api/dashboard/triggers');
  },

  getRecommendations() {
    return this.get('/api/dashboard/recommendations');
  },

  generateAnalysis() {
    return this.post('/api/dashboard/analysis');
  }
};
