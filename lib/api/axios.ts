// src/lib/api/axios.ts
"use client";

import axios, { AxiosError } from "axios";
import { isPrivateMode } from "../deviceUtils";

/**
 * Enterprise axios client:
 * - DEFERRED deviceUtils import (prevents early execution)
 * - attaches device headers
 * - injects access token (checks localStorage first, then sessionStorage)
 * - refresh token flow with queue
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Main API instance
const api = axios.create({
  baseURL: BASE_URL,
});

// Separate instance for refresh token API
const refreshApi = axios.create({
  baseURL: BASE_URL,
});

// Remove default global content-type
delete api.defaults.headers.common["Content-Type"];

// Helper to get token from preferred storage (local first for "remember", fallback to session)
const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem("accessToken");
  if (token) return token;
  return sessionStorage.getItem("accessToken");
};

// Helper to clear auth storage (both local and session)
const clearAuthStorage = () => {
  if (typeof window !== "undefined") {
    const authKeys = ["accessToken", "refreshToken", "user", "tempPassword"];
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }
};

/* ---------------------------------------------------------------
   🔵 Attach device headers (deferred import!)
---------------------------------------------------------------- */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const { getDeviceHeaders } = require("../deviceUtils");
    const deviceHeaders = getDeviceHeaders();

    Object.entries(deviceHeaders).forEach(([key, value]) =>
      config.headers?.set?.(key, value as any)
    );
  }

  return config;
});

/* Attach device headers to refresh API too */
refreshApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const { getDeviceHeaders } = require("../deviceUtils");
    const deviceHeaders = getDeviceHeaders();

    Object.entries(deviceHeaders).forEach(([key, value]) =>
      config.headers?.set?.(key, value as any)
    );
  }

  config.headers?.set?.("Content-Type", "application/json");
  return config;
});

/* ---------------------------------------------------------------
   🔐 Inject auth token + content-type control
---------------------------------------------------------------- */
api.interceptors.request.use((config: any) => {
  const token = getStoredToken();
  if (token) config.headers?.set?.("Authorization", `Bearer ${token}`);

  if (config.data instanceof FormData) {
    config.headers?.delete?.("Content-Type"); // let browser set
  } else {
    config.headers?.set?.("Content-Type", "application/json");
  }

  return config;
});

/* ---------------------------------------------------------------
   🔁 SAFE REFRESH TOKEN QUEUE
---------------------------------------------------------------- */

let isRefreshing = false;

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error?: any) => void;
}

const failedQueue: QueueItem[] = [];

const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });

  failedQueue.length = 0;
};

// Helper to store token in preferred storage (local first if possible)
const storeTokens = (accessToken: string, refreshToken?: string) => {
  const privateMode = isPrivateMode();
  const storage = privateMode ? sessionStorage : localStorage;
  
  storage.setItem("accessToken", accessToken);
  if (refreshToken) storage.setItem("refreshToken", refreshToken);
};

/* ---------------------------------------------------------------
   🔄 Response Interceptor (refresh logic)
---------------------------------------------------------------- */
api.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing → queue the request
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
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await refreshApi.post("/auth/refreshToken", {
          refreshToken,
        });

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        // Store new tokens (prioritize local if possible)
        storeTokens(newAccessToken, newRefreshToken);

        // Update axios defaults
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        // Retry original request
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return api(originalRequest);
      } catch (refreshError) {
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

    return Promise.reject(error);
  }
);

export default api;