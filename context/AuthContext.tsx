// context/AuthContext.tsx (updated to handle extracted tokens)
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
        const currentPath = window.location.pathname;
  
        if (userStr) {
          try {
            if (userStr === 'null' || userStr === 'undefined' || userStr.trim() === '') {
              localStorage.removeItem('user');
              return;
            }
            const user: User = JSON.parse(userStr);
            if (user && user.userId && user.role) {
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                  user,
                  accessToken: token || null,
                  refreshToken: refreshToken || null,
                },
              });
  
              // ✅ Redirect only if not already on login page
              if (currentPath === '/auth/login') {
                const targetPath = user.role === 'ADMIN' ? '/admin-dashboard' : '/dashboard';
                router.push(targetPath);
              }
  
              return;
            } else {
              localStorage.removeItem('user');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          } catch (parseError) {
            console.error('Failed to parse user from localStorage:', parseError);
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
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      }
  
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken: accessToken ?? null, refreshToken: refreshToken ?? null },
      });
  
      // use router.push (no full reload)
      const targetPath = user.role === 'ADMIN' ? '/admin-dashboard' : '/dashboard';
      router.push(targetPath);
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMsg = 'An unexpected error occurred. Please try again.';
      if (error.message?.includes('incorrect') || error.message?.includes('failed')) {
        errorMsg = 'Incorrect credentials. Please check your username/email and password.';
      }
      throw new Error(errorMsg);
    }
  };
  
  // const logout = () => {
  //   if (typeof window !== 'undefined') {
  //     localStorage.removeItem('accessToken');
  //     localStorage.removeItem('refreshToken');
  //     localStorage.removeItem('user');
  //   }
  //   dispatch({ type: 'LOGOUT' });
  //   window.location.href = '/auth/login';
  // };
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    dispatch({ type: 'LOGOUT' });
    router.push('/auth/login');
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