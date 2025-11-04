// lib/api/notificationService.ts
import { AxiosError, AxiosResponse } from "axios";
import api from "./axios";
import { NotificationDTO, WebResponseDTOListNotificationDTO } from "./types";

export const notificationService = {
  /**
   * Get all notifications for the logged-in user
   */
  async getAllNotifications(): Promise<WebResponseDTOListNotificationDTO> {
    try {
      const response: AxiosResponse<WebResponseDTOListNotificationDTO> =
        await api.get("/notification/getAllNotifications");
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      console.error("Error fetching notifications:", err.message);
      throw err;
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
  } catch (error) {
    const err = error as AxiosError;
    console.error("Error marking notifications as read:", err.message);
    throw err;
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
    } catch (error) {
      const err = error as AxiosError;
      console.error("Error clearing notifications:", err.message);
      throw err;
    }
  },

  /**
   * Clear all notifications for the user
   */
  async clearAll(): Promise<void> {
    try {
      await api.delete("/notification/clearAll");
    } catch (error) {
      const err = error as AxiosError;
      console.error("Error clearing all notifications:", err.message);
      throw err;
    }
  },
};
