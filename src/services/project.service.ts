import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { Project } from "@/types";

export const projectService = {
  list: (params?: ListParams) => api.get(API_ENDPOINTS.PROJECTS, { params }).then(normalizeList<Project>("projects")),
  stats: () => api.get(API_ENDPOINTS.PROJECT_STATS),
  get: (id: string) => api.get(API_ENDPOINTS.PROJECT_BY_ID(id)),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.PROJECTS, payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(API_ENDPOINTS.PROJECT_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.PROJECT_BY_ID(id)),
  regenerateCredentials: (id: string) => api.post(API_ENDPOINTS.PROJECT_REGENERATE_CREDENTIALS(id)),
};
