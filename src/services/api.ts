import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || '/api';

// Get the backend base URL (without /api)
export const getBackendBaseUrl = (): string => {
  const apiUrl = API_URL;
  // Remove /api suffix to get base URL
  if (apiUrl.endsWith('/api')) {
    return apiUrl.slice(0, -4);
  }
  return apiUrl;
};

// Fix attachment URLs that might have localhost:3000
export const fixAttachmentUrl = (url: string): string => {
  if (!url) return url;
  
  // If URL contains localhost, replace with actual backend URL
  if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
    const backendBase = getBackendBaseUrl();
    return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):3000/, backendBase);
  }
  
  // If URL is relative, make it absolute
  if (url.startsWith('/uploads/')) {
    return `${getBackendBaseUrl()}${url}`;
  }
  
  return url;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const api = apiClient;

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if it's NOT a login request
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      const campSlug = localStorage.getItem('campSlug');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('campSlug');
      // Redirect to appropriate login page (using hash for HashRouter)
      window.location.href = campSlug ? `/#/${campSlug}/login` : '/#/admin/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const login = async (email: string, password: string, campSlug?: string) => {
  const payload: any = { email, password };
  // Only include campSlug if it's actually provided (not undefined/null)
  if (campSlug) {
    payload.campSlug = campSlug;
  }
  const response = await api.post('/auth/login', payload);
  return response.data;
};

export default api;
