import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { Domain } from "@/types";

export const domainService = {
  list: (params?: ListParams) => api.get(API_ENDPOINTS.DOMAINS, { params }).then(normalizeList<Domain>("domains")),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.DOMAINS, payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(API_ENDPOINTS.DOMAIN_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.DOMAIN_BY_ID(id)),
};
