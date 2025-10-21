// lib/api/authService.ts
import api from "./axios";
import { LoginRequest, User, WebResponseDTO, LoginInnerResponse, LoginResponseInner, RefreshInnerResponse } from "./types";

export const authService = {
  async login(
    credentials: LoginRequest
  ): Promise<{ user: User; accessToken?: string; refreshToken?: string }> {
    const params = new URLSearchParams();
    // Explicitly append known fields to avoid `any` casts
    if (credentials.inputKey) params.append('inputKey', credentials.inputKey);
    if (credentials.password) params.append('password', credentials.password);

    // ✅ Send credentials as query params per backend requirement
    const response = await api.post<WebResponseDTO<LoginInnerResponse>>(
      `/auth/login?${params.toString()}`,
      {}
    );

    console.log("🧩 Full login API response:", response.data.response.data);

    if (response.data.flag && response.data.response?.data) {
      const innerData = response.data.response.data as LoginResponseInner;

      if (!innerData) {
        throw new Error('Login response missing inner data');
      }

      // ✅ Detect whether Admin from the API structure
      const isAdmin = !!innerData.userId && innerData.loginResponseDTO?.role === "ADMIN";

      // ✅ Build unified `User` object for context
      const user: User = {
        userId: isAdmin ? (innerData.userId as string) : (innerData.employeeId as string),
        userName: isAdmin
          ? (innerData.userName as string)
          : `${innerData.firstName ?? ""} ${innerData.lastName ?? ""}`.trim(),
          companyEmail: innerData.companyEmail || undefined,
        role: innerData.loginResponseDTO?.role as "ADMIN" | "EMPLOYEE" | "CLIENT",
        createdAt: isAdmin ? (innerData.createdAt as string) : (innerData.dateOfJoining as string),
        updatedAt: isAdmin
          ? (typeof (innerData as Record<string, unknown>)['updatedAt'] === 'string'
              ? ((innerData as Record<string, unknown>)['updatedAt'] as string)
              : '')
          : (innerData.status as string),
      };

      const accessToken = innerData.loginResponseDTO?.accessToken ?? "";
      const refreshToken = innerData.loginResponseDTO?.refreshToken ?? "";

      console.log("✅ Extracted user and tokens:", {
        role: user.role,
        name: user.userName,
        accessToken: accessToken ? "present" : "missing",
        refreshToken: refreshToken ? "present" : "missing",
      });

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
    const response = await api.post<WebResponseDTO<RefreshInnerResponse>>(
      "/auth/refreshToken",
      { refreshToken }
    );
    if (response.data.flag) {
      const inner = response.data.response?.data as RefreshInnerResponse['data'];

      if (!inner || !inner.user) {
        throw new Error('Refresh response missing user');
      }

      const { user, accessToken: accessTokenRaw, refreshToken: newRefreshToken } = inner;

      // Ensure returned tokens are strings (provide sensible defaults)
      const accessTokenStr: string = accessTokenRaw ?? "";
      const refreshTokenStr: string = newRefreshToken ?? "";

      return { user: user as User, accessToken: accessTokenStr, refreshToken: refreshTokenStr };
    }
    throw new Error(response.data.message || "Refresh failed");
  },
};
