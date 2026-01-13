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

// Helper to safely access localStorage
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore localStorage errors
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore localStorage errors
  }
};

// Helper to safely parse JSON from localStorage
const getStoredUser = (): User | null => {
  try {
    const stored = safeGetItem('authUser');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Global auth state management using Zustand
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  campSlug: null,
  isInitialized: false,

  initialize: () => {
    try {
      const token = safeGetItem('authToken');
      const user = getStoredUser();
      const campSlug = safeGetItem('campSlug');
      set({ user, token, campSlug, isInitialized: true });
    } catch {
      set({ user: null, token: null, campSlug: null, isInitialized: true });
    }
  },

  login: (user, token, campSlug) => {
    safeSetItem('authToken', token);
    safeSetItem('authUser', JSON.stringify(user));
    if (campSlug) {
      safeSetItem('campSlug', campSlug);
    } else {
      safeRemoveItem('campSlug');
    }
    set({ user, token, campSlug, isInitialized: true });
  },

  setAuth: (user, token, campSlug) => {
    safeSetItem('authToken', token);
    safeSetItem('authUser', JSON.stringify(user));
    if (campSlug) {
      safeSetItem('campSlug', campSlug);
    } else {
      safeRemoveItem('campSlug');
    }
    set({ user, token, campSlug, isInitialized: true });
  },

  logout: () => {
    safeRemoveItem('authToken');
    safeRemoveItem('authUser');
    safeRemoveItem('campSlug');
    set({ user: null, token: null, campSlug: null });
  },

  isAuthenticated: () => {
    const state = get();
    return !!state.token && !!state.user;
  }
}));
