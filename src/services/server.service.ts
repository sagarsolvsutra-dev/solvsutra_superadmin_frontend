import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { Server } from "@/types";

export const serverService = {
  list: (params?: ListParams) => api.get(API_ENDPOINTS.SERVERS, { params }).then(normalizeList<Server>("servers")),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.SERVERS, payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(API_ENDPOINTS.SERVER_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.SERVER_BY_ID(id)),
};
