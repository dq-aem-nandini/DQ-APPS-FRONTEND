// lib/api/authService.ts
import api from "./axios";
import {
  LoginRequest,
  LoggedInUser,
  WebResponseDTO,
  LoginInnerResponse,
  Role,
} from "./types";

export const authService = {
  async login(
    credentials: LoginRequest
  ): Promise<{ user: LoggedInUser; accessToken?: string; refreshToken?: string }> {
    const params = new URLSearchParams();
    if (credentials.inputKey) params.append("inputKey", credentials.inputKey);
    if (credentials.password) params.append("password", credentials.password);

    const response = await api.post<WebResponseDTO<LoginInnerResponse>>(
      `/auth/login?${params.toString()}`,
      {}
    );

    console.log("Login API Response:", response.data);

    if (response.data.flag && response.data.response?.data) {
      const innerData = response.data.response.data as any;

      const loginResp = innerData.loginResponseDTO;
      if (!loginResp) throw new Error("Invalid login response");

      const role = loginResp.role as Role;

      const accessToken = loginResp.accessToken ?? "";
      const refreshToken = loginResp.refreshToken ?? "";

      // CORRECT ID FOR ALL ROLES (HR & FINANCE included)
      const userId =
        role === "EMPLOYEE" || role === "MANAGER" || role === "HR" || role === "FINANCE"
          ? innerData.employeeId
          : role === "CLIENT"
            ? innerData.clientId
            : innerData.userId || "";

      const fullName =
        innerData.userName ||
        `${innerData.firstName ?? ""} ${innerData.lastName ?? ""}`.trim() ||
        "User";

      // FIXED: Extract firstLogin from loginResp (the correct location in response)
      const firstLogin = loginResp.firstLogin ?? false; // Now pulls from loginResponseDTO.firstLogin

      const user: LoggedInUser = {
        userId: userId || "",
        userName: fullName,
        companyEmail: innerData.companyEmail || "",
        role,
        firstLogin, // Use the correctly extracted value
        createdAt: innerData.createdAt || "",
        updatedAt: innerData.updatedAt || "",
        profileName: innerData.profileName?.trim() || fullName || "User",
      };

      console.log("LOGIN SUCCESS:", {
        profileName: user.profileName,
        userId: user.userId,
        role: user.role,
        firstLogin: user.firstLogin,
      });
      console.log("ALL POSSIBLE IDs FROM BACKEND:", {
        employeeId: innerData.employeeId,
        clientId: innerData.clientId,
        entityId: innerData.entityId,
        userId: innerData.userId,
        id: innerData.id,
      });
      console.log("LOGIN SUCCESS - firstLogin:", user.firstLogin); // Debug log
      return { user, accessToken, refreshToken };
    }

    throw new Error(response.data.message || "Login failed");
  },

  async presetDevice(): Promise<void> {
    await api.post("/auth/preset-device");
  },
};