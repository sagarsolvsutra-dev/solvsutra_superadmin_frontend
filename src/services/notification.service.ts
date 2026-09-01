import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { Notification } from "@/types";

export const notificationService = {
  list: (params?: ListParams) =>
    api.get(API_ENDPOINTS.NOTIFICATIONS, { params }).then(normalizeList<Notification>("notifications")),
  unreadCount: () => api.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT),
  markAsRead: (id: string) => api.put(API_ENDPOINTS.NOTIFICATION_MARK_READ(id)),
  markAllAsRead: () => api.put(API_ENDPOINTS.NOTIFICATIONS_READ_ALL),
  remove: (id: string) => api.delete(API_ENDPOINTS.NOTIFICATION_BY_ID(id)),
};
