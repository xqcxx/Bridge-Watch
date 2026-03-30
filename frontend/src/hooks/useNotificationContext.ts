import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContextValue";
import type { NotificationContextType } from "../context/NotificationContext.types";

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}
