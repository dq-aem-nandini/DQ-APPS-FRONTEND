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
const getAuthStorage = (rememberMe?: boolean): Storage => {
  if (typeof window === 'undefined') throw new Error('No storage available');
  
  const privateMode = isPrivateMode();
  if (privateMode || !rememberMe) {
    return sessionStorage;
  }
  // Test localStorage writability
  try {
    localStorage.setItem('_test_auth', '1');
    localStorage.removeItem('_test_auth');
    return localStorage;
  } catch {
    return sessionStorage;
  }
};

// Helper to load from storage (check local first, then session)
const loadFromStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  let value = localStorage.getItem(key);
  if (value !== null) return value;
  return sessionStorage.getItem(key);
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

      const token = loadFromStorage('accessToken');
      const refreshToken = loadFromStorage('refreshToken');
      const userStr = loadFromStorage('user');
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

// In login function: ADD PRE-SAVE LOG
// const login = async (
//   credentials: { inputKey: string; password: string },
//   rememberMe = false
// ) => {
//   try {
//     clearAuthStorage();

//     console.log('🚀 Login start - rememberMe flag:', rememberMe);

//     const { user, accessToken, refreshToken } =
//       await authService.login(credentials);

//     const storage = getAuthStorage(rememberMe);

//     storage.setItem('user', JSON.stringify(user));
//     storage.setItem('accessToken', accessToken ?? '');
//     storage.setItem('refreshToken', refreshToken ?? '');

//     // ✅ REMEMBER USERNAME
//     if (rememberMe) {
//       console.log('💾 Saving remembered username');
    
//       try {
//         localStorage.setItem(
//           'rememberedUsername',
//           credentials.inputKey
//         );
//       } catch (e) {
//         console.warn('Fallback to sessionStorage');
//         sessionStorage.setItem(
//           'rememberedUsername',
//           credentials.inputKey
//         );
//       }
//     } else {
//       localStorage.removeItem('rememberedUsername');
//       sessionStorage.removeItem('rememberedUsername');
//     }
    

//     // ✅✅✅ THIS WAS MISSING
//     dispatch({
//       type: 'LOGIN_SUCCESS',
//       payload: {
//         user,
//         accessToken: accessToken ?? null,
//         refreshToken:refreshToken ?? null,
//       },
//     });

//   } catch (error: any) {
//     console.error('Login failed:', error);
//     throw new Error('Invalid username/email or password.');
//   }
// };


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

    // ✅✅✅ THIS IS MANDATORY
    if (rememberMe) {
      console.log('💾 Saving remembered username');
      localStorage.setItem(
        'rememberedUsername',
        credentials.inputKey
      );
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
  try {
    const hadUsername = localStorage.getItem("rememberedUsername") || sessionStorage.getItem("rememberedUsername");
   
    console.log('🚪 Username cleared on logout - had value?', !!hadUsername); // NEW: Was there anything?
  } catch {}
  dispatch({ type: 'LOGOUT' });
  router.push('/auth/login');
};
  
  

  // Update user info
  const updateUser = (updatedUser: Partial<LoggedInUser>) => {
    const clean = Object.fromEntries(
      Object.entries(updatedUser).filter(([, v]) => v !== undefined)
    );

    dispatch({ type: 'UPDATE_USER', payload: clean });

    if (state.user) {
      const merged = { ...state.user, ...clean } as LoggedInUser;
      
      // Update in both storages for safety
      const userStr = JSON.stringify(merged);
      localStorage.setItem('user', userStr);
      sessionStorage.setItem('user', userStr);

      handlePostAuthRedirect(merged, window.location.pathname, router);
    }
  };

  // const logout = () => {
  //   clearAuthStorage();
  //   localStorage.removeItem("rememberedUsername");
  //   dispatch({ type: 'LOGOUT' });
  //   router.push('/auth/login');
  // };

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