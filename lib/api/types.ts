// lib/api/types.ts
export interface User {
  userId: string;
  userName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  createdAt?: string;
  // Add other fields from the log if needed
}

export interface LoginRequest {
  inputKey: string;
  password: string;
}

export interface TokenResponseData {
  accessToken?: string;
  refreshToken?: string;
  refreshExpiresAt?: string;
  tokenType?: string;
}

export interface ApiResponseObject<T = any> {
  data: T;
  message: string;
}

export interface WebResponseDTO<T> {
  flag: boolean;
  message: string;
  status: number;
  response: T;
  totalRecords: number;
  otherInfo: any;
}

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string | null; refreshToken: string | null } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

