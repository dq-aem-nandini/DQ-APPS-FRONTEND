// src/lib/api/sessionService.ts
import api from "./axios";
import type { MySessionsResponseDTO, DeviceSessionDTO } from "./types";
import toast from "react-hot-toast";
import { getDeviceIdSync } from "../deviceUtils";

const handleError = (error: any, fallback = "Operation failed") => {
  const backendMessage = error?.response?.data?.message;

  // Ignore expected race conditions (common on logout)
  if (
    backendMessage?.includes("OptimisticLockingFailureException") ||
    backendMessage?.includes("Row was updated or deleted") ||
    error?.response?.status === 404
  ) {
    console.info("Ignored expected race condition:", backendMessage);
    return;
  }

  const msg = backendMessage || fallback;
  toast.error(msg);
  throw error;
};

export const sessionService = {
  async getMySessions(): Promise<MySessionsResponseDTO> {
    try {
      const res = await api.get<{ response: MySessionsResponseDTO }>("/user/sessions");
      return res.data.response;
    } catch (error) {
      handleError(error, "Failed to load sessions");
      throw error;
    }
  },

  async getActiveSessions(): Promise<DeviceSessionDTO[]> {
    const data = await this.getMySessions();
    return data.activeSessions;
  },

  async logoutDevice(deviceId: string): Promise<void> {
    try {
      await api.post(`/user/logout?deviceId=${encodeURIComponent(deviceId)}`);
    } catch (error) {
      handleError(error, "Failed to logout device");
    }
  },

  async logoutAllExceptCurrent(): Promise<void> {
    const deviceId = getDeviceIdSync();
    if (!deviceId) throw new Error("Device ID not found");
    try {
      await api.post(`/user/logout-all?currentDeviceSessionId=${encodeURIComponent(deviceId)}`);
    } catch (error) {
      handleError(error, "Failed to logout other devices");
    }
  },

  async logoutCurrent(): Promise<void> {
    const deviceId = getDeviceIdSync();
    if (!deviceId) return;
    try {
      await api.post(`/user/logout?deviceId=${encodeURIComponent(deviceId)}`);
    } catch (error) {
      handleError(error); // logout errors are usually fine
    }
  },
};
