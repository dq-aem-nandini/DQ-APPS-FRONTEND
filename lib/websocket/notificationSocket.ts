import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

let stompClient: Client | null = null;

/**
 * Connect to WebSocket and subscribe to user's notification topic.
 * @param userId - Logged-in user's ID
 * @param onMessage - Callback when new notification arrives
 */
export const connectWebSocket = (
  userId: string,
  onMessage: (message: any) => void
) => {
  if (!userId) return;

  // Adjust backend base URL here
  const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/ws";

  const socket = new SockJS(SOCKET_URL);

  stompClient = new Client({
    webSocketFactory: () => socket as any,
    reconnectDelay: 5000, // Auto-reconnect every 5s
    debug: (str) => console.log(str),
  });

  stompClient.onConnect = () => {
    console.log("✅ Connected to WebSocket");

    stompClient?.subscribe(`/topic/notifications/${userId}`, (msg: IMessage) => {
      const notification = JSON.parse(msg.body);
      console.log("📩 Notification received:", notification);
      onMessage(notification);
    });
  };

  stompClient.onStompError = (frame) => {
    console.error("❌ STOMP Error:", frame.headers["message"]);
  };

  stompClient.activate();
};

/** Disconnect from WebSocket */
export const disconnectWebSocket = () => {
  if (stompClient && stompClient.active) {
    stompClient.deactivate();
    console.log("🔌 Disconnected from WebSocket");
  }
};
