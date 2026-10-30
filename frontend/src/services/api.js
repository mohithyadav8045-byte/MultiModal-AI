import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor: Attach JWT bearer token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('omnidoc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor: Handle unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        localStorage.removeItem('omnidoc_token');
        localStorage.removeItem('omnidoc_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, fullName) => api.post('/auth/register', { email, password, fullName }),
  getMe: () => api.get('/auth/me')
};

// Asset endpoints
export const assetService = {
  upload: (formData, onProgress) => api.post('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  }),
  list: (params = {}) => api.get('/assets', { params }),
  get: (id) => api.get(`/assets/${id}`),
  delete: (id) => api.delete(`/assets/${id}`),
  getStats: () => api.get('/assets/stats/summary'),
  getFileUrl: (id) => `${API_BASE_URL}/assets/${id}/file`
};

// Chat endpoints
export const chatService = {
  createSession: (title) => api.post('/chat/sessions', { title }),
  listSessions: () => api.get('/chat/sessions'),
  getMessages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
  sendMessage: (payload) => api.post('/chat/message', payload)
};

// Report endpoints
export const reportService = {
  generate: (payload) => api.post('/reports/generate', payload),
  list: () => api.get('/reports'),
  get: (id) => api.get(`/reports/${id}`),
  delete: (id) => api.delete(`/reports/${id}`)
};

export default api;

