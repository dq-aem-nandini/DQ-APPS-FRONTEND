// // lib/api/notificationService.ts
// import { AxiosError, AxiosResponse } from "axios";
// import {WebResponseDTOListNotificationDTO, WebResponseDTOVoid } from "./types";
// import api from "./axios";

// class NotificationService {

//     /**
//      * Mark a notification as read (PATCH with query param).
//      */
//     async markAsRead(notificationId: string): Promise<WebResponseDTOVoid> {
//       try {
//         const response: AxiosResponse<WebResponseDTOVoid> = await api.patch(
//           '/web/api/v1/notification/read',
//           null,
//           { params: { notificationId } }
//         );
//         console.log('🧩 Full mark as read API response:', response.data);
//         const { flag, message, status, totalRecords, otherInfo } = response.data;
//         return {
//           flag,
//           message: message || (flag ? 'Notification marked as read' : 'Failed to mark as read'),
//           status: status ?? (flag ? 200 : 400),
//           response: null,
//           totalRecords: totalRecords ?? 0,
//           otherInfo: otherInfo ?? null,
//         };
//       } catch (error: unknown) {
//         console.error('❌ Error marking notification as read:', error);
//         let errorMessage = 'Failed to mark notification as read';
//         let errorStatus = 500;
//         if (error instanceof AxiosError ) {
//           errorMessage = error.response?.data?.message || error.message || 'Failed to mark as read';
//           errorStatus = error.response?.status || 500;
//         }
//         return {
//           flag: false,
//           message: errorMessage,
//           status: errorStatus,
//           response: null,
//           totalRecords: 0,
//           otherInfo: null,
//         };
//       }
//     }
  
//     /**
//      * Get all user notifications (GET no params).
//      */
//     async getAllNotifications(): Promise<WebResponseDTOListNotificationDTO> {
//       try {
//         const response: AxiosResponse<WebResponseDTOListNotificationDTO> = await api.get('/web/api/v1/notification/getAllNotifications');
//         console.log('🧩 Full get all notifications API response:', response.data);
//         if (response.data.flag && response.data.response) {
//           return response.data;
//         }
//         throw new Error(response.data.message || 'Failed to fetch notifications');
//       } catch (error: unknown) {
//         console.error('❌ Error fetching notifications:', error);
//         const errorMessage = error instanceof AxiosError
//           ? error.response?.data?.message || error.message || 'Failed to fetch notifications'
//           : 'Failed to fetch notifications';
//         throw new Error(errorMessage);
//       }
//     }
  
//     /**
//      * Clear a single notification (DELETE with query param).
//      */
//     async clearNotification(notificationId: string): Promise<WebResponseDTOVoid> {
//       try {
//         const response: AxiosResponse<WebResponseDTOVoid> = await api.delete(
//           '/web/api/v1/notification/clear',
//           { params: { notificationId } }
//         );
//         console.log('🧩 Full clear notification API response:', response.data);
//         const { flag, message, status, totalRecords, otherInfo } = response.data;
//         return {
//           flag,
//           message: message || (flag ? 'Notification cleared' : 'Failed to clear notification'),
//           status: status ?? (flag ? 200 : 400),
//           response: null,
//           totalRecords: totalRecords ?? 0,
//           otherInfo: otherInfo ?? null,
//         };
//       } catch (error: unknown) {
//         console.error('❌ Error clearing notification:', error);
//         let errorMessage = 'Failed to clear notification';
//         let errorStatus = 500;
//         if (error instanceof AxiosError) {
//           errorMessage = error.response?.data?.message || error.message || 'Failed to clear notification';
//           errorStatus = error.response?.status || 500;
//         }
//         return {
//           flag: false,
//           message: errorMessage,
//           status: errorStatus,
//           response: null,
//           totalRecords: 0,
//           otherInfo: null,
//         };
//       }
//     }
  
//     /**
//      * Clear all notifications (DELETE no params).
//      */
//     async clearAllNotifications(): Promise<WebResponseDTOVoid> {
//       try {
//         const response: AxiosResponse<WebResponseDTOVoid> = await api.delete('/web/api/v1/notification/clearAll');
//         console.log('🧩 Full clear all notifications API response:', response.data);
//         const { flag, message, status, totalRecords, otherInfo } = response.data;
//         return {
//           flag,
//           message: message || (flag ? 'All notifications cleared' : 'Failed to clear all notifications'),
//           status: status ?? (flag ? 200 : 400),
//           response: null,
//           totalRecords: totalRecords ?? 0,
//           otherInfo: otherInfo ?? null,
//         };
//       } catch (error: unknown) {
//         console.error('❌ Error clearing all notifications:', error);
//         let errorMessage = 'Failed to clear all notifications';
//         let errorStatus = 500;
//         if (error instanceof AxiosError) {
//           errorMessage = error.response?.data?.message || error.message || 'Failed to clear all notifications';
//           errorStatus = error.response?.status || 500;
//         }
//         return {
//           flag: false,
//           message: errorMessage,
//           status: errorStatus,
//           response: null,
//           totalRecords: 0,
//           otherInfo: null,
//         };
//       }
//     }
//   }
  
//   export const notificationService = new NotificationService();

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
      await api.patch("/notification/read", { notificationIds });
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
