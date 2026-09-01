import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { Plan } from "@/types";

export const planService = {
  list: (params?: ListParams) => api.get(API_ENDPOINTS.PLANS, { params }).then(normalizeList<Plan>("plans")),
  get: (id: string) => api.get(API_ENDPOINTS.PLAN_BY_ID(id)),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.PLANS, payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(API_ENDPOINTS.PLAN_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.PLAN_BY_ID(id)),
};
