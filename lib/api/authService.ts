// lib/api/authService.ts (updated to send login credentials as query params and handle optional email)
import api from "./axios";
import { LoginRequest, User, WebResponseDTO, LoginInnerResponse, RefreshInnerResponse } from "./types";

export const authService = {
  async login(
    credentials: LoginRequest
  ): Promise<{ user: User; accessToken?: string; refreshToken?: string }> {
    const params = new URLSearchParams();
    Object.keys(credentials).forEach(key => {
      params.append(key, (credentials as any)[key]);
    });
    const response = await api.post<WebResponseDTO<LoginInnerResponse>>(`/auth/login?${params.toString()}`, {});
    if (response.data.flag) {
      const innerData = response.data.response.data;
      const user: User = {
        userId: innerData.userId,
        userName: innerData.userName,
        email: innerData.email || undefined, // Handle null email
        role: innerData.role as "ADMIN" | "EMPLOYEE" | "CLIENT",
        createdAt: innerData.createdAt,
        updatedAt: innerData.updatedAt,
      };
      const { accessToken, refreshToken } = innerData.loginResponseDTO;
      console.log("Extracted tokens for user:", {
        user: user.userName,
        accessToken: accessToken ? "present" : "missing",
        refreshToken: refreshToken ? "present" : "missing",
      }); // Debug
      return { user, accessToken, refreshToken };
    }
    throw new Error(response.data.message || "Login failed");
  },

  async presetDevice(): Promise<void> {
    await api.post("/auth/preset-device");
  },

  async refreshToken(
    refreshToken: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const response = await api.post<WebResponseDTO<RefreshInnerResponse>>("/auth/refreshToken", { refreshToken });
    if (response.data.flag) {
      const {
        user,
        accessToken,
        refreshToken: newRefreshToken,
      } = response.data.response.data;
      return { user, accessToken, refreshToken: newRefreshToken };
    }
    throw new Error(response.data.message || "Refresh failed");
  },
};