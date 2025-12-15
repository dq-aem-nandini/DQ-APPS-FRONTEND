// lib/api/authService.ts
import api from "./axios";
import {
  LoginRequest,
  LoggedInUser,
  WebResponseDTO,
  LoginInnerResponse,
  RoleObject,
  Role
} from "./types";

export const authService = {
  async login(
    credentials: LoginRequest
  ): Promise<{ user: LoggedInUser; accessToken?: string; refreshToken?: string }> {
    try {
      const response = await api.post<WebResponseDTO<LoginInnerResponse>>(
        "/auth/login",
        {
          inputKey: credentials.inputKey,
          password: credentials.password,
        }
      );

      console.log("Login API Response:", response.data);

      // BACKEND FAILURE — PRESERVE EXACT MESSAGE
      if (!response.data.flag) {
        // This is the key change: Use backend message directly, fallback only if truly empty
        const backendMessage = response.data.message?.trim();
        throw new Error(backendMessage || "Login failed. Please try again.");
      }

      const innerData = response.data.response?.data;
      if (!innerData) throw new Error("Invalid response format from server");

      const loginResp = innerData.loginResponseDTO;
      if (!loginResp) throw new Error("Missing login data");

      // ✔ Correct role name
      const roleName: Role = loginResp.roleName;

      // ✔ Build RoleObject with permissions
      const roleObj: RoleObject = {
        roleId: "",
        roleName,
        roleDesc: "",
        permissions: loginResp.permissions ?? [],
      };

      // ✔ Build final user object
      const user: LoggedInUser = {
        userId: innerData.userId,
        userName: innerData.userName,
        companyEmail: innerData.companyEmail,
        createdAt: innerData.createdAt,
        updatedAt: innerData.updatedAt,
        firstLogin: loginResp.firstLogin ?? false,
        profileName: innerData.profileName || innerData.userName,
        entityId: innerData.entityId,
        hasSubordinates: innerData.hasSubordinates,
        role: roleObj,
        permissions: loginResp.permissions ?? [],
      };

      console.log("LOGIN PARSED USER:", {
        userId: user.userId,
        profileName: user.profileName,
        role: user.role.roleName,
        permissions: user.permissions,
        firstLogin: user.firstLogin,
      });

      return {
        user,
        accessToken: loginResp.accessToken,
        refreshToken: loginResp.refreshToken,
      };
    } catch (error: any) {
      // CRITICAL: Re-throw the original error to preserve message
      // Do NOT wrap or override here
      throw error;
    }
  },

  async presetDevice(): Promise<void> {
    await api.post("/auth/preset-device");
  },
};