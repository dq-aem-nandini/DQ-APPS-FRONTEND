// lib/api/authService.ts
import api from "./axios";
import { LoginRequest, User, WebResponseDTO, LoginInnerResponse, RefreshInnerResponse } from "./types";

export const authService = {
  async login(
    credentials: LoginRequest
  ): Promise<{ user: User; accessToken?: string; refreshToken?: string }> {
    const params = new URLSearchParams();
    Object.keys(credentials).forEach((key) => {
      params.append(key, (credentials as any)[key]);
    });

    // ✅ Send credentials as query params per backend requirement
    const response = await api.post<WebResponseDTO<LoginInnerResponse>>(
      `/auth/login?${params.toString()}`,
      {}
    );

    console.log("🧩 Full login API response:", response.data.response.data);

    if (response.data.flag && response.data.response?.data) {
      const innerData = response.data.response.data;

      // ✅ Detect whether Admin or Employee from the API structure
      const isAdmin = !!innerData.userId && innerData.loginResponseDTO?.role === "ADMIN";
      const isEmployee = !!innerData.employeeId && innerData.loginResponseDTO?.role === "EMPLOYEE";

      // ✅ Build unified `User` object for context
      const user: User = {
        userId: isAdmin ? innerData.userId : innerData.employeeId,
        userName: isAdmin
          ? innerData.userName
          : `${innerData.firstName ?? ""} ${innerData.lastName ?? ""}`.trim(),
          // companyEmail: innerData.companyEmail || undefined,
        role: innerData.loginResponseDTO?.role as "ADMIN" | "EMPLOYEE" | "CLIENT",
        createdAt: isAdmin ? innerData.createdAt : innerData.dateOfJoining,
        updatedAt: isAdmin ? innerData.updatedAt : innerData.status,
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
      const { user, accessToken, refreshToken: newRefreshToken } =
        response.data.response.data;
      return { user, accessToken, refreshToken: newRefreshToken };
    }
    throw new Error(response.data.message || "Refresh failed");
  },
};
