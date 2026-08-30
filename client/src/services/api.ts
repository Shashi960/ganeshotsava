import axios from 'axios';

// @ts-ignore
let rawBaseUrl = import.meta.env.VITE_API_URL || '/api';
if (rawBaseUrl !== '/api' && !rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = `${rawBaseUrl.replace(/\/$/, '')}/api`;
}

const api = axios.create({
  baseURL: rawBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if session expired
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('/uploads')) {
    // @ts-ignore
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (apiUrl) {
      const base = apiUrl.replace(/\/api$/, '').replace(/\/$/, '');
      return `${base}${url}`;
    }
  }
  return url;
};

export default api;
