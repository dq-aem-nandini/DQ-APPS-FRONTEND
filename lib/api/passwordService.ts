// passwordService.ts

import type {
  UpdatePasswordRequestDTO,
  PasswordResponseDTO,
  WebResponseDTOPasswordResponseDTO,
  WebResponseDTOObject,
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

  // Send OTP for password reset
  async sendOTP(identifier: string): Promise<WebResponseDTOPasswordResponseDTO> {
    try {
      const response = await api.post("/auth/password/sendOTP", null, {
        params: { identifier },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send OTP: ${error}`);
    }
  }

  // Verify OTP
  async verifyOTP(identifier: string, otp: string): Promise<WebResponseDTOPasswordResponseDTO> {
    try {
      const response = await api.post("/auth/password/verifyOTP", null, {
        params: { identifier, otp },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to verify OTP: ${error}`);
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