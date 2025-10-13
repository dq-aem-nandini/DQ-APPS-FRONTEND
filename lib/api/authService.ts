// lib/api/authService.ts (updated to return full response for token extraction)
import api from './axios';
import { LoginRequest, User, WebResponseDTO } from './types';

export const authService = {
  async login(credentials: LoginRequest): Promise<{ user: User; accessToken?: string; refreshToken?: string }> {
    const response = await api.post<WebResponseDTO<{ data: User; message: string }>>('/auth/login', credentials);
    if (response.data.flag) {
      const user = response.data.response.data;
      // Extract tokens from headers if backend sets them (e.g., Set-Cookie or Authorization)
      const accessToken = response.headers['authorization']?.replace('Bearer ', '') || '';
      const refreshToken = response.headers['x-refresh-token'] || ''; // Adjust header name if different
      return { user, accessToken, refreshToken };
    }
    throw new Error(response.data.message || 'Login failed');
  },

  async presetDevice(): Promise<void> {
    await api.post('/auth/preset-device');
  },

  async refreshToken(refreshToken: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await api.post<WebResponseDTO<{ data: User; message: string }>>('/auth/refreshToken', { refreshToken });
    if (response.data.flag) {
      const user = response.data.response.data;
      const accessToken = response.headers['authorization']?.replace('Bearer ', '') || '';
      const newRefreshToken = response.headers['x-refresh-token'] || refreshToken;
      return { user, accessToken, refreshToken: newRefreshToken };
    }
    throw new Error(response.data.message || 'Refresh failed');
  },
};
