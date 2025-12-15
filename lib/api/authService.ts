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
 
    const response = await api.post<WebResponseDTO<LoginInnerResponse>>(
      "/auth/login",
      {
        inputKey: credentials.inputKey,
        password: credentials.password,
      }
    );

    console.log("Login API Response:", response.data);

    // BACKEND FAILURE
    if (!response.data.flag) {
      throw new Error(response.data.message || "Incorrect credentials");
    }

    const innerData = response.data.response?.data;
    if (!innerData) throw new Error("Invalid login response format");

    const loginResp = innerData.loginResponseDTO;
    if (!loginResp) throw new Error("Missing loginResponseDTO");

    // ✔ Correct role name
    const roleName: Role = loginResp.roleName;

    // ✔ Build RoleObject with permissions
    const roleObj: RoleObject = {
      roleId: "",                  // backend does not send
      roleName,
      roleDesc: "",                // backend does not send
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

      // NEW fields from your updated types
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
  },

  async presetDevice(): Promise<void> {
    await api.post("/auth/preset-device");
  },
};