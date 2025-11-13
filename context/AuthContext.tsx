// context/AuthContext.tsx (complete with fixed initAuth for empty userId and refresh persistence)
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, AuthAction, LoggedInUser } from '@/lib/api/types';
import { authService } from '@/lib/api/authService';

const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: { inputKey: string; password: string }) => Promise<void>;
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
        // Merge without overriding with undefined
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Helper to get role-based path (excluding first login check)
  const getRoleBasedPath = (user: LoggedInUser) => {
    return user.role === 'ADMIN' ? '/admin-dashboard' :
      user.role === 'EMPLOYEE' ? '/dashboard' :
        user.role === 'MANAGER' ? '/manager' :
          user.role === 'CLIENT' ? '/client-dashboard' :
            user.role === 'HR' ? '/hr' :
              user.role === 'FINANCE' ? '/finance' :
                '/dashboard'; // Fallback
  };

  // Helper to handle post-auth redirect (with first login check)
  const handlePostAuthRedirect = (user: LoggedInUser, currentPath: string) => {
    if (currentPath === '/auth/login') {
      if (user.firstLogin) {
        console.log('🧩 First login - redirecting to /auth/setup');
        router.push('/auth/setup');
      } else {
        const targetPath = getRoleBasedPath(user);
        console.log('🧩 Normal login - redirecting to', targetPath);
        router.push(targetPath);
      }
    }
    if (currentPath === '/auth/setup' && !user.firstLogin) {
      const targetPath = getRoleBasedPath(user);
      console.log('🧩 Setup complete - redirecting to', targetPath);
      router.push(targetPath);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // FIXED: Set loading false immediately if no window (SSR)
      if (typeof window === 'undefined') {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');
      const currentPath = window.location.pathname;
      if (userStr) {
        try {
          if (userStr === 'null' || userStr === 'undefined' || userStr.trim() === '') {
            localStorage.removeItem('user');
          } else {
            const user: LoggedInUser = JSON.parse(userStr);
            // FIXED: Relaxed check - role is primary validator, userId can be empty
            if (user && user.role) { // Removed user.userId check (allow empty)
              // FIXED: Check if token exists before restoring
              if (!token) {
                console.log('❌ No token - clearing localStorage');
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                dispatch({ type: 'SET_LOADING', payload: false });
                return;
              }
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                  user,
                  accessToken: token,
                  refreshToken: refreshToken || null,
                },
              });

              // FIXED: Use setTimeout for redirect to ensure state update propagates
              setTimeout(() => {
                handlePostAuthRedirect(user, currentPath);
              }, 0); // Next tick

              dispatch({ type: 'SET_LOADING', payload: false }); // FIXED: Set false after success
              return;
            } else {
              console.log('❌ Invalid user data - clearing localStorage', { userId: user?.userId, role: user?.role });
              localStorage.removeItem('user');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          }
        } catch (parseError) {
          console.error('Failed to parse user from localStorage:', parseError);
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }

      // FIXED: Always set loading false at end
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    initAuth();
  }, [router]);

  const login = async (credentials: { inputKey: string; password: string }) => {
    try {
      const { user, accessToken, refreshToken } = await authService.login(credentials);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        // NEW: Store temp password for auto-fill in setup if first login
        if (user.firstLogin) {
          localStorage.setItem('tempPassword', credentials.password);
        }
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken: accessToken ?? null, refreshToken: refreshToken ?? null },
      });

      // Handle redirect with first login check (currentPath will be /auth/login)
      handlePostAuthRedirect(user, '/auth/login');
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMsg = 'An unexpected error occurred. Please try again.';
      if (error.message?.includes('incorrect') || error.message?.includes('failed')) {
        errorMsg = 'Incorrect credentials. Please check your username/email and password.';
      }
      throw new Error(errorMsg);
    }
  };

  // NEW: Update user state (e.g., after first login setup)
  const updateUser = (updatedUser: Partial<LoggedInUser>) => {
    // Filter out undefined values to avoid overriding required fields
    const filteredUpdatedUser = Object.fromEntries(
      Object.entries(updatedUser).filter(([_, value]) => value !== undefined)
    ) as Partial<LoggedInUser>;

    dispatch({ type: 'UPDATE_USER', payload: filteredUpdatedUser });

    // Persist to localStorage
    if (typeof window !== 'undefined' && state.user) {
      const updated = { ...state.user, ...filteredUpdatedUser } as LoggedInUser;
      localStorage.setItem('user', JSON.stringify(updated));
      // Handle potential redirect if firstLogin changed
      handlePostAuthRedirect(updated, window.location.pathname);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    dispatch({ type: 'LOGOUT' });
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};