// lib/api/notificationService.ts
import { AxiosError, AxiosResponse } from "axios";
import api from "./axios";
import { NotificationDTO, WebResponseDTOListNotificationDTO } from "./types";
function getBackendError(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.response ||
    error?.response?.data ||
    error?.message ||
    "Something went wrong"
  );
}
export const notificationService = {
  /**
   * Get all notifications for the logged-in user
   */
  async getAllNotifications(): Promise<WebResponseDTOListNotificationDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListNotificationDTO> =
        await api.get("/notification/getAllNotifications");
      return response.data;
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Mark selected notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
  try {
    const params = new URLSearchParams();
    notificationIds.forEach((id) => params.append("notificationIds", id));
    await api.patch(`/notification/read?${params.toString()}`);
  } catch (error: any) {
    throw new Error(getBackendError(error));
  }
},


  /**
   * Clear selected notifications
   */
  async clearNotifications(notificationIds: string[]): Promise<void> {
    try {
      await api.delete("/notification/clear", {
        data: { notificationIds },
      });
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },

  /**
   * Clear all notifications for the user
   */
  async clearAll(): Promise<void> {
    try {
      await api.delete("/notification/clearAll");
    } catch (error: any) {
      throw new Error(getBackendError(error));
    }
  },
};
