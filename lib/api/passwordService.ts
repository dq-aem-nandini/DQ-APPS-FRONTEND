// passwordService.ts

import type {
  UpdatePasswordRequestDTO,
  PasswordResponseDTO,
  WebResponseDTOPasswordResponseDTO,
  WebResponseDTOObject,
  PasswordCheckRequestDTO,
  WebResponseDTOPasswordCheck,
} from "@/lib/api/types";
import api from "./axios";

export class PasswordService {
  // Update password
  async updatePassword(request: UpdatePasswordRequestDTO): Promise<WebResponseDTOObject> {
    try {
      const response = await api.post("/user/updatePassWord", request);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update password: ${error}`);
    }
  }
  // Send OTP
  async sendOTP(identifier: string): Promise<WebResponseDTOPasswordResponseDTO> {
    try {
      const response = await api.post("/auth/password/sendOTP", null, {
        params: { identifier },
      });
  
      const backendMessage =
        response.data?.response?.message ||
        response.data?.message ||
        "No backend message";
  
      return {
        ...response.data,
        message: backendMessage,
        response: {
          ...response.data.response,
          message: backendMessage,
        },
      };
  
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.response?.message ||
        error?.response?.data?.message ||
        "Failed to send OTP";
  
      const fallbackStatus: PasswordResponseDTO["status"] = "RESET_FAILED";
  
      return {
        flag: false,
        message: backendMessage,
        status: 400,             // fallback for required field
        totalRecords: 0,         // fallback
        otherInfo: "",           // fallback (required in your schema)
        response: {
          identifier: "",
          status: fallbackStatus,
          timestamp: new Date().toISOString(),
          expiry: new Date().toISOString(),     // MUST be string (NOT null)
          verified: false,
          message: backendMessage,
        },
      };
    }
  }
  
  

  

  // Verify OTP
  async verifyOTP(identifier: string, otp: string): Promise<WebResponseDTOPasswordResponseDTO> {
    try {
      const response = await api.post("/auth/password/verifyOTP", null, {
        params: { identifier, otp },
      });
      return response.data;
    } catch (error: any) {
      // If backend sends an actual error response, extract the backend message
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.response?.message ||
        "Failed to verify OTP.";
  
      // Throw backend message so UI shows correct text
      throw new Error(backendMessage);
    }
  }
  
  // Check password strength
  async checkPassword(data: PasswordCheckRequestDTO): Promise<WebResponseDTOPasswordCheck> {
    console.log("checkPassword called with:", data); // ADD THIS
    try {
      const response = await api.post("/auth/password/check", data);
      console.log("checkPassword success:", response.data); // ADD THIS
      return response.data;
    } catch (error: any) {
      console.error("checkPassword API ERROR:", error); // ADD THIS
        console.error("Full error:", error.response?.data);
      const backendMessage =
        error?.response?.data?.message ||
        "Failed to check password.";
  
      throw new Error(backendMessage);
    }
  }
  
  // Reset password
  async resetPassword(identifier: string, otp: string, newPassword: string): Promise<WebResponseDTOPasswordResponseDTO> {
    try {
      const response = await api.post("/auth/password/resetPassWord", null, {
        params: { identifier, otp, newPassword },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to reset password: ${error}`);
    }
  }
}