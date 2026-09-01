import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";

export const dashboardService = {
  stats: () => api.get(API_ENDPOINTS.DASHBOARD),
  widgets: () => api.get(API_ENDPOINTS.DASHBOARD_WIDGETS),
};
