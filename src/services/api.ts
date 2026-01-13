import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || '/api';

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
      // Redirect to appropriate login page
      window.location.href = campSlug ? `/${campSlug}/login` : '/admin/login';
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
