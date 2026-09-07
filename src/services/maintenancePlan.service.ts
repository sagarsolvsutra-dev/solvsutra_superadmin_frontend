import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { MaintenancePlan } from "@/types";

export const maintenancePlanService = {
  list: (params?: ListParams) =>
    api.get(API_ENDPOINTS.MAINTENANCE_PLANS, { params }).then(normalizeList<MaintenancePlan>("maintenancePlans")),
  get: (id: string) => api.get(API_ENDPOINTS.MAINTENANCE_PLAN_BY_ID(id)),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.MAINTENANCE_PLANS, payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(API_ENDPOINTS.MAINTENANCE_PLAN_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.MAINTENANCE_PLAN_BY_ID(id)),
};
