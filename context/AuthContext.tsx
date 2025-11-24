// context/AuthContext.tsx
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

      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');
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

      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    initAuth();
  }, [router]);

  // Login Handler
  const login = async (credentials: { inputKey: string; password: string }) => {
    try {
      // 💥 1. Clear old data (important!)
      // localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
  
      // 2. Do login
      const { user, accessToken, refreshToken } = await authService.login(credentials);
  
      // 3. Save new user
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken ?? "");
      localStorage.setItem("refreshToken", refreshToken ?? "");
  
      if (user.firstLogin) {
        localStorage.setItem("tempPassword", credentials.password);
      }
  
      // 4. Update state
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user,
          accessToken: accessToken ?? null,
          refreshToken: refreshToken ?? null,
        },
      });
  
      // 5. Redirect (delay ensures new role loads)
      setTimeout(() => {
        handlePostAuthRedirect(user, "/auth/login", router);
      }, 10);
  
    } catch (error: any) {
      console.error("Login failed:", error);
      throw new Error("Invalid username/email or password.");
    }
  };
  
  
  

  // Update user info
  const updateUser = (updatedUser: Partial<LoggedInUser>) => {
    const clean = Object.fromEntries(
      Object.entries(updatedUser).filter(([, v]) => v !== undefined)
    );

    dispatch({ type: 'UPDATE_USER', payload: clean });

    if (state.user) {
      const merged = { ...state.user, ...clean } as LoggedInUser;
      localStorage.setItem('user', JSON.stringify(merged));

      handlePostAuthRedirect(merged, window.location.pathname, router);
    }
  };

  const logout = () => {
    localStorage.clear();
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
