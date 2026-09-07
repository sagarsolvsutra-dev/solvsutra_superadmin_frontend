import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { MaintenanceSubscription, ProjectMaintenanceStatus } from "@/types";
import type { AxiosResponse } from "axios";

export const maintenanceService = {
  list: (params?: ListParams) =>
    api
      .get(API_ENDPOINTS.MAINTENANCE_SUBSCRIPTIONS, { params })
      .then(normalizeList<MaintenanceSubscription>("maintenanceSubscriptions")),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.MAINTENANCE_SUBSCRIPTIONS, payload),
  update: (id: string, payload: Record<string, unknown>) =>
    api.put(API_ENDPOINTS.MAINTENANCE_SUBSCRIPTION_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.MAINTENANCE_SUBSCRIPTION_BY_ID(id)),
  renew: (id: string) => api.post(API_ENDPOINTS.MAINTENANCE_SUBSCRIPTION_RENEW(id)),

  projectStatus: (projectId: string): Promise<AxiosResponse<ProjectMaintenanceStatus>> =>
    api.get(API_ENDPOINTS.PROJECT_MAINTENANCE_STATUS(projectId)),
  toggleProjectMaintenance: (projectId: string, maintenanceRequired: boolean): Promise<AxiosResponse<ProjectMaintenanceStatus>> =>
    api.put(API_ENDPOINTS.PROJECT_MAINTENANCE_TOGGLE(projectId), { maintenanceRequired }),
};
