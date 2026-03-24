// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, AuthAction, LoggedInUser } from '@/lib/api/types';
import { authService } from '@/lib/api/authService';
import { isPrivateMode } from '@/lib/deviceUtils';

const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: { inputKey: string; password: string }, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<LoggedInUser>) => void;
} | null>(null);

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'UPDATE_USER':
      if (state.user && action.payload) {
        const updatedUser = {
          ...state.user,
          ...Object.fromEntries(
            Object.entries(action.payload).filter(([, value]) => value !== undefined)
          ),
        };
        return { ...state, user: updatedUser as LoggedInUser };
      }
      return state;

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// ✅ ONLY TWO DASHBOARDS
const getRoleBasedPath = (user: LoggedInUser) => {
  const role = user.role.roleName;

  if (role === 'ADMIN') return '/admin-dashboard';

  // ALL OTHERS
  return '/dashboard';
};

// Handle redirect after login/setup
const handlePostAuthRedirect = (user: LoggedInUser, currentPath: string, router: any) => {
  const target = getRoleBasedPath(user);

  if (currentPath === '/auth/login') {
    if (user.firstLogin) {
      router.push('/auth/setup');
    } else {
      router.push(target);
    }
  }

  if (currentPath === '/auth/setup' && !user.firstLogin) {
    router.push(target);
  }
};

// Helper to get preferred storage for auth (local if rememberMe and not private, else session)
const getAuthStorage = (rememberMe = false): Storage => {
  if (typeof window === 'undefined') throw new Error('No storage available');

  // Always try localStorage first if writable — this enables sharing in incognito
  try {
    const testKey = '_test_auth_' + Date.now();
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    console.log('[STORAGE] localStorage writable → using localStorage (shared in incognito!)');
    return localStorage;
  } catch (e) {
    console.warn('[STORAGE] localStorage blocked → fallback to sessionStorage (tab-isolated)', e);
    return sessionStorage;
  }
};

// Helper to load from storage (check local first, then session)
const loadFromStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;

  // In private mode, localStorage is temp, but we still check it first as per your original
  let value = localStorage.getItem(key);
  if (value !== null) {
    console.log(`[STORAGE LOAD] ${key} found in localStorage`);
    return value;
  }

  value = sessionStorage.getItem(key);
  if (value !== null) {
    console.log(`[STORAGE LOAD] ${key} found in sessionStorage`);
    return value;
  }

  console.log(`[STORAGE LOAD] ${key} NOT found in either storage`);
  return null;
};

// Helper to clear auth storage (both)
const clearAuthStorage = () => {
  if (typeof window === 'undefined') return;
  const authKeys = [
    'user',
    'accessToken',
    'refreshToken',
    'tempPassword'
  ];
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Auto-initialize user from storage
  useEffect(() => {
    const initAuth = () => {

      if (typeof window === 'undefined') {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      console.log('[INIT AUTH] Running in path:', window.location.pathname);
      console.log('[INIT AUTH] isPrivateMode check (if you still use it):', isPrivateMode?.() ?? 'not called');
      const token = loadFromStorage('accessToken');
      console.log('[INIT AUTH] accessToken:', token ? 'found' : 'missing');
      const refreshToken = loadFromStorage('refreshToken');
      console.log('[INIT AUTH] refreshToken:', refreshToken ? 'found' : 'missing');
      const userStr = loadFromStorage('user');
      console.log('[INIT AUTH] user:', userStr ? 'found' : 'missing');
      const currentPath = window.location.pathname;

      if (userStr && userStr !== 'null' && userStr !== 'undefined') {
        try {
          const user: LoggedInUser = JSON.parse(userStr);

          if (user?.role?.roleName && token) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, accessToken: token, refreshToken },
            });

            setTimeout(() => {
              handlePostAuthRedirect(user, currentPath, router);
            }, 0);

            dispatch({ type: 'SET_LOADING', payload: false });
            return;
          }
        } catch {
          // fall through and clear
        }
      }

      clearAuthStorage();
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    initAuth();
  }, [router]);

  const login = async (
    credentials: { inputKey: string; password: string },
    rememberMe = false
  ) => {
    try {
      console.log('🚀 Login start - rememberMe flag:', rememberMe);

      const { user, accessToken, refreshToken } =
        await authService.login(credentials);

      const storage = getAuthStorage(rememberMe);

      storage.setItem('user', JSON.stringify(user));
      storage.setItem('accessToken', accessToken ?? '');
      storage.setItem('refreshToken', refreshToken ?? '');
      if (rememberMe) {
        console.log('💾 Saving remembered username to chosen storage');
        const storage = getAuthStorage(rememberMe);  // note: no separate variable name
        storage.setItem('rememberedUsername', credentials.inputKey);
      } else {
        localStorage.removeItem('rememberedUsername');
        sessionStorage.removeItem('rememberedUsername');
      }
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user,
          accessToken: accessToken ?? null,
          refreshToken: refreshToken ?? null,
        },
      });
    } catch (error) {
      throw error;
    }
  };
  // In logout: ADD CONFIRM CLEAR
  const logout = () => {
    clearAuthStorage();
    localStorage.removeItem('rememberedUsername');
    sessionStorage.removeItem('rememberedUsername');
    try {
      const hadUsername = localStorage.getItem("rememberedUsername") || sessionStorage.getItem("rememberedUsername");
      console.log('🚪 Username cleared on logout - had value?', !!hadUsername); // NEW: Was there anything?
    } catch { }
    dispatch({ type: 'LOGOUT' });
    router.push('/auth/login');
  };
  // Update user info
  const updateUser = (updatedUser: Partial<LoggedInUser>) => {
    const clean = Object.fromEntries(
      Object.entries(updatedUser).filter(([, v]) => v !== undefined)
    );
    dispatch({ type: 'UPDATE_USER', payload: clean });
    // In updateUser:
    if (state.user) {
      const merged = { ...state.user, ...clean } as LoggedInUser;
      const userStr = JSON.stringify(merged);
      const storage = getAuthStorage(true);  // force try local
      storage.setItem('user', userStr);
      sessionStorage.setItem('user', userStr); // fallback / sync
      handlePostAuthRedirect(merged, window.location.pathname, router);
    }
  };
  return (
    <AuthContext.Provider value={{ state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};