"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Notification } from "@/types";

/** Live-pushes every newly created notification over a websocket, so the
 * badge/list/toast update instantly instead of waiting for the next poll.
 * Reconnects automatically (socket.io's default behavior) if the backend
 * restarts or the connection drops. */
export function useNotificationSocket(onNewNotification: (notification: Notification) => void) {
  const token = useAuthStore((s) => s.token);
  const callbackRef = useRef(onNewNotification);
  callbackRef.current = onNewNotification;

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("notification:new", (notification: Notification) => {
      callbackRef.current(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);
}
