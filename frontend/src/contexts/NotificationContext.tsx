// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Notification {
  id: string;
  message: string;
  date: Date;
  read: boolean;
}

interface NotificationContextValue {
  notifications: Notification[];
  push: (message: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const push = (message: string) => {
    const notif: Notification = {
      id: Date.now().toString(),
      message,
      date: new Date(),
      read: false,
    };
    setNotifications((n) => [notif, ...n]);
  };

  const markRead = (id: string) =>
    setNotifications((n) =>
      n.map((x) => (x.id === id ? { ...x, read: true } : x))
    );

  const markAllRead = () =>
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));

  return (
    <NotificationContext.Provider
      value={{ notifications, push, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
};
