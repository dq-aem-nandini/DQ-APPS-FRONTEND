"use client";

import React, { useEffect, useState, useRef } from "react";
import { notificationService } from "@/lib/api/notificationService";
import { NotificationDTO } from "@/lib/api/types";
import { Bell, MoreVertical, X, Check, CheckCheck, Trash2 } from "lucide-react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { useAuth } from "@/context/AuthContext";
import { leaveService } from "@/lib/api/leaveService";
import {
  LeaveResponseDTO,
  PendingLeavesResponseDTO,
} from "@/lib/api/types";
import Swal from "sweetalert2";

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className = "h-6 w-6",
}) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationDTO | null>(null);
  const [showModal, setShowModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { state } = useAuth();
  const userRole = state.user?.role.roleName;
  const userId = state.user?.userId;

  // Reuse the exact same token logic as axios.ts
  const getStoredToken = (): string | null => {
    if (typeof window === "undefined") return null;
    let token = localStorage.getItem("accessToken");
    if (token) return token;
    return sessionStorage.getItem("accessToken");
  };

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getAllNotifications();
      setNotifications(res.response || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  useEffect(() => {
    loadNotifications();

    if (!userId) {
      console.log("No userId, skipping WebSocket connection");
      return;
    }

    const SOCKET_URL = `${process.env.NEXT_PUBLIC_API_URL}/ws`;
    const token = getStoredToken();

    if (!token) {
      console.warn("No accessToken found – WebSocket will not authenticate");
      return;
    }

    const socket = new SockJS(SOCKET_URL);

    // Fix: Pass factory function to enable auto-reconnect
    const stompClient = Stomp.over(() => new SockJS(SOCKET_URL));

    stompClient.reconnect_delay = 5000; // Reconnect every 5 seconds if disconnected
    stompClient.debug = () => { }; // Silence verbose logs (optional)

    const connectHeaders = {
      Authorization: `Bearer ${token}`,
    };

    stompClient.connect(
      connectHeaders,
      () => {
        console.log("WebSocket Connected & Authenticated!");

        stompClient.subscribe(`/topic/notifications/${userId}`, (message) => {
          if (message.body) {
            try {
              const data = JSON.parse(message.body);
              const newNotifications = Array.isArray(data) ? data : [data];

              setNotifications((prev) => {
                const filteredPrev = prev.filter(
                  (existing) =>
                    !newNotifications.some(
                      (newNotif: NotificationDTO) => newNotif.id === existing.id
                    )
                );

                return [
                  ...newNotifications.map((n: NotificationDTO) => ({
                    ...n,
                    read: false,
                  })),
                  ...filteredPrev,
                ];
              });
            } catch (err) {
              console.error("Error parsing WebSocket message:", err);
            }
          }
        });
      },
      (error: any) => {
        console.error("WebSocket connection error:", error);
        if (error.headers?.message?.includes("401")) {
          console.error("401 Unauthorized – Token may be invalid or expired");
        }
      }
    );

    return () => {
      if (stompClient.connected) {
        stompClient.disconnect(() => {
          console.log("WebSocket Disconnected");
        });
      }
    };
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false); // CLOSE THE DROPDOWN
        setOpenMenuId(null);    // also close 3-dot menus
        setShowModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead([id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.clearNotifications([id]);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleReviewLeaveFromNotification = (
    leave: LeaveResponseDTO | PendingLeavesResponseDTO
  ) => {
    const getLabel = (value: string): string => {
      return value
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    Swal.fire({
      title: 'Review Leave Request',
      width: 600,
      html: `
        <div class="text-left text-sm text-gray-600 space-y-3">
          <p><strong>Employee:</strong> ${leave.employeeName ?? 'Unknown'}</p>
          <p><strong>Type:</strong> ${leave.leaveCategoryType ? getLabel(leave.leaveCategoryType) : 'N/A'}</p>
          <p><strong>Duration:</strong> ${leave.leaveDuration ?? 0} days</p>
          <p><strong>From:</strong> ${new Date(leave.fromDate!).toLocaleDateString()}</p>
          <p><strong>To:</strong> ${new Date(leave.toDate!).toLocaleDateString()}</p>
          <p><strong>Reason:</strong> ${leave.context || 'No reason provided'}</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea id="review-reason" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Add a comment..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Approve",
      denyButtonText: "Reject",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "mx-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700",
        denyButton: "mx-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700",
        cancelButton: "mx-2 px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
      },
      preConfirm: () => ({
        action: "APPROVED" as const,
        reason: (document.getElementById("review-reason") as HTMLTextAreaElement)?.value?.trim() || ""
      }),
      preDeny: () => ({
        action: "REJECTED" as const,
        reason: (document.getElementById("review-reason") as HTMLTextAreaElement)?.value?.trim() || ""
      })
    }).then(async (result) => {
      if (!result.isConfirmed && !result.isDenied) return;

      const { action, reason } = result.value!;

      Swal.fire({ title: "Processing...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      try {
        await leaveService.updateLeaveStatus(leave.leaveId!, action, reason);

        Swal.fire({
          icon: "success",
          title: action === "APPROVED" ? "Leave Approved" : "Leave Rejected",
          text: reason || undefined,
          timer: 2000,
          showConfirmButton: false
        });

      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to update leave", "error");
      }
    });
  };

  // ------------------------------------------------------------
  // ⭐ ROLE-BASED NOTIFICATION ACTIONS
  // ------------------------------------------------------------
  const handleOpenNotification = async (notification: NotificationDTO) => {
    console.log("[NOTIF CLICK] Starting handler for notification:", {
      id: notification.id,
      type: notification.notificationType,
      referenceId: notification.referenceId,
      read: notification.read,
      userRole,
    });

    try {
      // ✅ Mark as read
      if (!notification.read) {
        await notificationService.markAsRead([notification.id]);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      }

      setDropdownOpen(false);

      // ✅ BASE PATH
      const isAdmin = userRole === "ADMIN";
      const basePath = isAdmin ? "/admin-dashboard" : "/dashboard";

      // ✅ TARGET PATH
      let targetPath = basePath;
      const type = (notification.notificationType || "").toUpperCase().trim();

      if (type.includes("LEAVE")) {
        targetPath = `${basePath}/leaves`;

      } else if (type.includes("TIMESHEET")) {
        targetPath = isAdmin
          ? `${basePath}/timesheet`
          : `${basePath}/TimeSheetRegister`; // ✅ FIXED

      } else if (type.includes("HOLIDAY")) {
        targetPath = `${basePath}/holiday`;

      } else if (type.includes("INVOICE")) {
        targetPath = `${basePath}/invoice`;

      } else if (type.includes("SALARY")) {
        targetPath = isAdmin
          ? `${basePath}/salaries` // ✅ FIXED
          : `${basePath}/salary`;

      } else if (
        type.includes("UPDATEREQUEST") ||
        type.includes("UPDATE_REQUEST") ||
        type.includes("PROFILE")
      ) {
        targetPath = `${basePath}/updaterequest`;
      }

      // ✅ FINAL URL
      let finalUrl = targetPath;
      if (notification.referenceId) {
        console.log(
          "[NOTIF → URL] referenceId from notification:",
          notification.referenceId,
          "type:", typeof notification.referenceId
        );
        finalUrl += `?requestId=${encodeURIComponent(notification.referenceId)}`;
      }

      console.log("[NOTIF CLICK] Navigating to:", finalUrl);

      setTimeout(() => {
        window.location.href = finalUrl;
      }, 300);

    } catch (error) {
      console.error("[NOTIF CLICK] FAILED:", error);
      setSelectedNotification(notification);
      setShowModal(true);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="relative">
        <Bell className={`${className}`} />
        {notifications.some((n) => !n.read) && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg z-50 border border-gray-200">
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group flex items-start px-5 py-4 border-b border-gray-100 last:border-none hover:bg-indigo-50/40 transition-all duration-150 cursor-pointer ${notification.read ? "bg-gray-50/70" : "bg-white"
                    }`}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-relaxed ${notification.read ? "text-gray-600" : "text-gray-900 font-semibold"
                        }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(notification.updatedAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 ml-3 relative group">
                    {/* Double tick (seen) / Single tick (unseen) */}
                    {notification.read ? (
                      <CheckCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Check className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    )}

                    {/* Tooltip - real-time app style */}
                    <div className="absolute -bottom-9 right-0 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md px-2.5 py-1.5 shadow-md whitespace-nowrap z-20 pointer-events-none">
                      {notification.read ? "Seen" : "Delivered"}
                    </div>

                    {/* 3-dot menu with delete icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === notification.id ? null : notification.id);
                      }}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {openMenuId === notification.id && (
                      <div className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                        <button
                          className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                            setOpenMenuId(null);
                          }}
                        >
                          <CheckCheck className="w-4 h-4 mr-2 text-blue-500" />
                          Mark as Read
                        </button>

                        <button
                          className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                            setOpenMenuId(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

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

      {showModal && selectedNotification && (
        <div
          className="fixed inset-0 bg-opacity-50 pt-54 flex items-start justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-[450px] max-w-[90vw] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold mb-3 text-gray-800">Notification Details</h2>

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
                {new Date(selectedNotification.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;