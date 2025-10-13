
// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, AuthAction, User } from '@/lib/api/types';
import { authService } from '@/lib/api/authService';

const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: { inputKey: string; password: string }) => Promise<void>;
  logout: () => void;
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

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');
        if (token && refreshToken && userStr) {
          try {
            // Validate and parse userStr
            if (userStr === 'null' || userStr === 'undefined' || userStr.trim() === '') {
              // Clear invalid data
              localStorage.removeItem('user');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              return;
            }
            const user: User = JSON.parse(userStr);
            if (user && user.userId && user.role) { // Basic validation
              dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken: token, refreshToken } });
            } else {
              // Clear invalid data
              localStorage.removeItem('user');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          } catch (parseError) {
            console.error('Failed to parse user from localStorage:', parseError);
            // Clear corrupted data
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    initAuth();
  }, [router]);

  const login = async (credentials: { inputKey: string; password: string }) => {
    try {
      const { user, accessToken, refreshToken } = await authService.login(credentials);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken || '');
        localStorage.setItem('refreshToken', refreshToken || '');
      }
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken: accessToken || null, refreshToken: refreshToken || null } });
      alert('Login successful! Redirecting to your dashboard...');
      // Immediate redirect
      const targetPath = user.role === 'ADMIN' ? '/admin-dashboard' : '/dashboard';
      window.location.href = targetPath;
    } catch (error: any) {
      console.error('Login failed:', error);
      // Handle specific errors
      let errorMsg = 'An unexpected error occurred. Please try again.';
      if (error.message.includes('incorrect') || error.message.includes('failed')) {
        errorMsg = 'Incorrect credentials. Please check your username/email and password and try again.';
      } else if (error.message.includes('Server internal error')) {
        errorMsg = 'Server error. Please try again later or contact support.';
      }
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    dispatch({ type: 'LOGOUT' });
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
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
