import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ListParams } from "./types";

/** Internal staff/admin accounts — created via /auth/register, listed/edited/deleted via /auth/users. */
export const userService = {
  list: (params?: ListParams) => api.get(API_ENDPOINTS.USERS, { params }),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.AUTH_REGISTER, payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(API_ENDPOINTS.USER_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.USER_BY_ID(id)),
};
