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
function getBackendError(error: any): string {
  return (
    error?.backendMessage ||  
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.response ||
    error?.response?.data ||
    error?.message ||
    "Something went wrong"
  );
}
export class PasswordService {
  // Update password
  async updatePassword(request: UpdatePasswordRequestDTO): Promise<WebResponseDTOObject> {
    try {
      const response = await api.post("/user/updatePassWord", request);
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
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
      console.log("sendOTP AXIOS ERROR 👉",error.response.status )
      // throw new Error(getBackendError(error));
      throw error;

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
      throw new Error(getBackendError(error));
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
      throw new Error(getBackendError(error));
    }
  }
  
  // Reset password
  async resetPassword(identifier: string, otp: string, newPassword: string): Promise<WebResponseDTOPasswordResponseDTO> {
    try {
      const response = await api.post("/auth/password/resetPassWord", null, {
        params: { identifier, otp, newPassword },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  }
}