// src/lib/api/axios.ts
"use client";

import axios, { AxiosError } from "axios";
import { isPrivateMode } from "../deviceUtils";

/**
 * Enterprise axios client:
 * - Preserves exact backend error messages
 * - Safe refresh token flow
 * - No manual error strings
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Define error response shape (matches your backend)
interface ApiErrorResponse {
  flag: boolean;
  message?: string;
  otherInfo?: any;
}

// Main API instance
const api = axios.create({
  baseURL: BASE_URL,
});

const refreshApi = axios.create({
  baseURL: BASE_URL,
});

delete api.defaults.headers.common["Content-Type"];

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem("accessToken");
  if (token) return token;
  return sessionStorage.getItem("accessToken");
};

const clearAuthStorage = () => {
  if (typeof window !== "undefined") {
    const authKeys = ["accessToken", "refreshToken", "user", "tempPassword"];
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }
};

/* Device headers */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const { getDeviceHeaders } = require("../deviceUtils");
    const deviceHeaders = getDeviceHeaders();
    Object.entries(deviceHeaders).forEach(([key, value]) => {
      config.headers?.set?.(key, value as string);
    });
  }
  return config;
});

refreshApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const { getDeviceHeaders } = require("../deviceUtils");
    const deviceHeaders = getDeviceHeaders();
    Object.entries(deviceHeaders).forEach(([key, value]) => {
      config.headers?.set?.(key, value as string);
    });
  }
  config.headers?.set?.("Content-Type", "application/json");
  return config;
});

/* Auth token + content-type */
api.interceptors.request.use((config: any) => {
  const token = getStoredToken();
  if (token) {
    config.headers?.set?.("Authorization", `Bearer ${token}`);
  }

  if (config.data instanceof FormData) {
    config.headers?.delete?.("Content-Type");
  } else {
    config.headers?.set?.("Content-Type", "application/json");
  }

  return config;
});

/* Refresh token queue */
let isRefreshing = false;
interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}
const failedQueue: QueueItem[] = [];

const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });
  failedQueue.length = 0;
};

const storeTokens = (accessToken: string, refreshToken?: string) => {
  const privateMode = isPrivateMode();
  const storage = privateMode ? sessionStorage : localStorage;
  storage.setItem("accessToken", accessToken);
  if (refreshToken) storage.setItem("refreshToken", refreshToken);
};

/* Response Interceptor - PRESERVE BACKEND MESSAGE */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Special handling for login endpoint
    if (originalRequest?.url?.includes('/auth/login')) {
      const errorData = error.response?.data as ApiErrorResponse | undefined;
      const backendMessage = errorData?.message || "Login failed. Please try again.";
      return Promise.reject(new Error(backendMessage));
    }

    // Refresh token logic for protected routes
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.set("Authorization", `Bearer ${token}`);
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        let refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) refreshToken = sessionStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Session expired. Please log in again.");

        const { data } = await refreshApi.post("/auth/refreshToken", { refreshToken });

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        storeTokens(newAccessToken, newRefreshToken);
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        clearAuthStorage();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other API errors — extract backend message if exists
    const errorData = error.response?.data as ApiErrorResponse | undefined;
    if (errorData?.message) {
      return Promise.reject(new Error(errorData.message));
    }

    // Fallback: original error (should rarely hit)
    return Promise.reject(error);
  }
);

export default api;