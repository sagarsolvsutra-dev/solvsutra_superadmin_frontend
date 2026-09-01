import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { ActivityLog } from "@/types";

export const activityLogService = {
  list: (params?: ListParams) => api.get(API_ENDPOINTS.ACTIVITY_LOGS, { params }).then(normalizeList<ActivityLog>("logs")),
  recent: () => api.get(API_ENDPOINTS.ACTIVITY_LOGS_RECENT),
};
