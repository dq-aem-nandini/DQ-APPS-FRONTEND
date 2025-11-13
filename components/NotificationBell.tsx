"use client";

import React, { useEffect, useState } from "react";
import { notificationService } from "@/lib/api/notificationService";
import { NotificationDTO } from "@/lib/api/types";
import { Bell, MoreVertical, X } from "lucide-react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { timesheetService } from "@/lib/api/timeSheetService";
import dayjs from "dayjs";

// ✅ Accept className as a prop with a default size
interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = "h-6 w-6" }) => {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationDTO | null>(null);
  const [showModal, setShowModal] = useState(false);

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    loadNotifications();

    if (!userId) return;

    // ✅ WebSocket live updates setup
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
      console.log("✅ Connected to WebSocket");

      stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
        if (message.body) {
          try {
            const data = JSON.parse(message.body);
            // Handle both single & array notifications
            const newNotifications = Array.isArray(data) ? data : [data];

            setNotifications((prev) => [
              ...newNotifications.map((n) => ({ ...n, read: false })),
              ...prev,
            ]);
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        }
      });
    });

    // ✅ Cleanup on unmount (must be synchronous)
    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => {
          console.log("WebSocket disconnected");
        });
      }
    };
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getAllNotifications();
      setNotifications(res.response || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead([id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.clearNotifications([id]);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // ✅ When clicking a notification -> open modal
  // const handleOpenNotification = async (notification: NotificationDTO) => {
  //   try {
  //     if (!notification.read)
  //       await notificationService.markAsRead([notification.id]);
  //     setNotifications((prev) =>
  //       prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
  //     );
  //     setSelectedNotification(notification);
  //     setShowModal(true);
  //   } catch (error) {
  //     console.error("Error opening notification:", error);
  //   }
  // };
        // Navigate based on notification type
  const handleOpenNotification = async (notification: NotificationDTO) => {
    try {
      // Mark as read
      if (!notification.read) {
        await notificationService.markAsRead([notification.id]);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      }

      if (notification.notificationType === "TIMESHEET") {
        // Fetch one timesheet to get workDate
        const res = await timesheetService.getTimesheetById(notification.referenceId,'referenceId');
        const timesheet = res.response;
        if (!timesheet?.workDate) {
          setSelectedNotification(notification);
          setShowModal(true);
          return;
        }

        const workDate = dayjs(timesheet.workDate);
        const weekStart = workDate.startOf('isoWeek');

        // Navigate to manager timesheet with employee + week
        const url = `/manager/timesheets?employeeId=${notification.employeeId}&week=${weekStart.format('YYYY-MM-DD')}`;
        window.location.href = url;
      } 
      else if (notification.notificationType === "LEAVE") {
        window.location.href = `/manager/leaves`;
      } 
      else {
        setSelectedNotification(notification);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
      setSelectedNotification(notification);
      setShowModal(true);
    }
  };
  return (
    <div className="relative">
      {/* 🔔 Bell Icon */}
      <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="relative">
        <Bell className={`${className}`} />
        {notifications.some((n) => !n.read) && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg z-50 border border-gray-200">
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex justify-between items-start px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-all duration-150 ${
                    notification.read ? "bg-gray-100" : "bg-white"
                  }`}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <div className="flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        notification.read
                          ? "text-gray-500"
                          : "text-gray-900 font-medium"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* ⋮ Menu */}
                  <div className="relative ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === notification.id ? null : notification.id
                        );
                      }}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {openMenuId === notification.id && (
                      <div className="absolute right-0 mt-2 bg-white border rounded shadow-md z-10 min-w-[140px]">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                            setOpenMenuId(null);
                          }}
                        >
                          Mark as Read
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                            setOpenMenuId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 🧹 Clear All */}
          {notifications.length > 0 && (
            <div className="p-2 border-t text-center">
              <button
                onClick={async () => {
                  await notificationService.clearAll();
                  setNotifications([]);
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🪟 Notification Details Modal */}
        {showModal && selectedNotification && (
        <div
          className="fixed inset-0  bg-opacity-50 flex items-start pt-54  justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-[450px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
 
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              Notification Details
            </h2>
 
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">
              {selectedNotification.message}
            </p>
 
            <div className="text-sm text-gray-500 space-y-1">
              <p>
                <span className="font-medium text-gray-600">Reference ID:</span>{" "}
                {selectedNotification.referenceId || "N/A"}
              </p>
              <p>
                <span className="font-medium text-gray-600">Created At:</span>{" "}
                {new Date(selectedNotification.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
