import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  campSlug: string | null;
  isInitialized: boolean;
  login: (user: User, token: string, campSlug: string | null) => void;
  setAuth: (user: User, token: string, campSlug: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  initialize: () => void;
}

// Helper to safely parse JSON from localStorage
const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Global auth state management using Zustand
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem('authToken'),
  campSlug: localStorage.getItem('campSlug'),
  isInitialized: false,

  initialize: () => {
    const token = localStorage.getItem('authToken');
    const user = getStoredUser();
    const campSlug = localStorage.getItem('campSlug');
    set({ user, token, campSlug, isInitialized: true });
  },

  login: (user, token, campSlug) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    if (campSlug) {
      localStorage.setItem('campSlug', campSlug);
    } else {
      localStorage.removeItem('campSlug');
    }
    set({ user, token, campSlug, isInitialized: true });
  },

  setAuth: (user, token, campSlug) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    if (campSlug) {
      localStorage.setItem('campSlug', campSlug);
    } else {
      localStorage.removeItem('campSlug');
    }
    set({ user, token, campSlug, isInitialized: true });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('campSlug');
    set({ user: null, token: null, campSlug: null });
  },

  isAuthenticated: () => {
    const state = get();
    return !!state.token && !!state.user;
  }
}));
