import { useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import { useNotificationContext } from "./useNotificationContext";
import type { NotificationType } from "../context/NotificationContext.types";

interface RawNotification {
  type: string;
  data: {
    title: string;
    message: string;
    notifType?: NotificationType;
    link?: string;
  };
}

export function useNotifications() {
  const { addNotification } = useNotificationContext();

  const handleMessage = useCallback((data: unknown) => {
    const raw = data as RawNotification;
    
    // Check if it's a notification message
    if (raw.type === "notification") {
      addNotification({
        title: raw.data.title,
        message: raw.data.message,
        type: raw.data.notifType || "info",
        link: raw.data.link,
      });
    }
  }, [addNotification]);

  // Subscribe to the "notifications" channel
  useWebSocket("notifications", handleMessage);

  return null; // Side-effect only hook
}
