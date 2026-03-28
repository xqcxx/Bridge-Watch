import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

export type NotificationType = "alert" | "system" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  preferences: NotificationPreferences;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useLocalStorageState<Notification[]>("stellar-notifications", []);
  const [preferences, setPreferences] = useLocalStorageState<NotificationPreferences>("notification-prefs", {
    soundEnabled: true,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (notif: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    if (preferences.soundEnabled) {
      const audio = new Audio("/notification-sound.mp3");
      audio.play().catch(() => {
        // Handle cases where audio play is blocked by the browser
        console.warn("Notification sound blocked by browser");
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const updatePreferences = (newPrefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPrefs }));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        updatePreferences,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}
