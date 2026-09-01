import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { Subscription } from "@/types";

export const subscriptionService = {
  list: (params?: ListParams) =>
    api.get(API_ENDPOINTS.SUBSCRIPTIONS, { params }).then(normalizeList<Subscription>("subscriptions")),
  stats: () => api.get(API_ENDPOINTS.SUBSCRIPTION_STATS),
  get: (id: string) => api.get(API_ENDPOINTS.SUBSCRIPTION_BY_ID(id)),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.SUBSCRIPTIONS, payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(API_ENDPOINTS.SUBSCRIPTION_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.SUBSCRIPTION_BY_ID(id)),
  renew: (id: string, payload: Record<string, unknown>) => api.post(API_ENDPOINTS.SUBSCRIPTION_RENEW(id), payload),
  suspend: (id: string) => api.post(API_ENDPOINTS.SUBSCRIPTION_SUSPEND(id)),
};
