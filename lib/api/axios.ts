// lib/api/axios.ts
import axios from 'axios';
import { getDeviceHeaders } from './deviceUtils';

const api = axios.create({
  baseURL: 'http://192.168.1.26:8080/web/api/v1',
    // baseURL: 'https://emptimehub-production-dd24.up.railway.app/web/api/v1',
    headers: {
    'Content-Type': 'application/json',
    ...getDeviceHeaders(),
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Re-apply device headers on each request to ensure they're fresh
  Object.assign(config.headers, getDeviceHeaders());
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (refreshToken) {
          const response = await api.post('/auth/refreshToken', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  } 
);

export default api;
