import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { Client } from "@/types";

export const clientService = {
  list: (params?: ListParams) => api.get(API_ENDPOINTS.CLIENTS, { params }).then(normalizeList<Client>("clients")),
  stats: () => api.get(API_ENDPOINTS.CLIENT_STATS),
  get: (id: string) => api.get(API_ENDPOINTS.CLIENT_BY_ID(id)),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.CLIENTS, payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(API_ENDPOINTS.CLIENT_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.CLIENT_BY_ID(id)),
};
