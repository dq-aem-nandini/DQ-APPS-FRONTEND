// lib/api/authService.ts
import api from "./axios";
import { LoginRequest, User, WebResponseDTO, LoginInnerResponse, RefreshTokenResponseDTO, LoginResponseInner } from "./types";

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

    console.log("🧩 Full login API response:", response.data.response?.data);

    if (response.data.flag && response.data.response?.data) {
      const innerData = response.data.response.data as LoginResponseInner;

      // ✅ Detect role from the loginResponseDTO
      const loginResp = innerData.loginResponseDTO;
      if (!loginResp) {
        throw new Error('Invalid login response structure');
      }
      const role = loginResp.role as "ADMIN" | "EMPLOYEE" | "CLIENT" | "MANAGER" | "HR" | "FINANCE";

      const accessToken = loginResp.accessToken ?? "";
      const refreshToken = loginResp.refreshToken ?? "";

      // ✅ Enhanced logging for employeeId based on role
      let extractedId: string | undefined;
      if (role === "EMPLOYEE" || role === "MANAGER") {
        extractedId = innerData.employeeId;
        console.log("👤 EMPLOYEE/MANAGER - Extracted employeeId:", extractedId, role);
      } else if (role === "CLIENT") {
        extractedId = innerData.clientId;
        console.log("🏢 CLIENT - Extracted clientId:", extractedId, role);
      } else {
        extractedId = innerData.userId;
        console.log("🔐 ADMIN - Extracted userId:", extractedId, role);
      }

      // ✅ Build unified `User` object based on role, ensuring userId is set to the appropriate ID (employeeId for employees/managers)
      let user: User;
      if (role === "ADMIN") {
        user = {
          userId: innerData.userId || "",
          userName: innerData.userName || "",
          companyEmail: innerData.companyEmail || innerData.email || "",
          role,
          createdAt: innerData.createdAt || "",
          updatedAt: innerData.updatedAt || "",
        };
      } else {
        // For EMPLOYEE, CLIENT, MANAGER - set userId to role-specific ID (prioritize employeeId for employees/managers)
        const roleSpecificId = (role === "EMPLOYEE" || role === "MANAGER") 
          ? innerData.employeeId 
          : innerData.clientId || innerData.userId || "";
        user = {
          userId: roleSpecificId || innerData.userId || "",
          userName: innerData.userName || `${innerData.firstName ?? ""} ${innerData.lastName ?? ""}`.trim(),
          companyEmail: innerData.companyEmail || "",
          role,
          createdAt: innerData.createdAt || innerData.dateOfJoining || "",
          updatedAt: innerData.updatedAt || "",
        };
      }

      console.log("✅ Extracted user and tokens:", {
        role: user.role,
        id: user.userId, // Now clearly logs the set userId (which is employeeId for employees)
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
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Based on OpenAPI schema: direct RefreshTokenResponseDTO (not wrapped in WebResponseDTO)
    const response = await api.post<RefreshTokenResponseDTO>(
      "/auth/refreshToken",
      { refreshToken }
    );

    if (response.data && response.data.accessToken && response.data.refreshToken) {
      return {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }

    throw new Error("Refresh failed");
  },
};