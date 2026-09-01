import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { Employee } from "@/types";

export const employeeService = {
  list: (params?: ListParams) => api.get(API_ENDPOINTS.EMPLOYEES, { params }).then(normalizeList<Employee>("employees")),
  get: (id: string) => api.get(API_ENDPOINTS.EMPLOYEE_BY_ID(id)),
  create: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.EMPLOYEES, payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(API_ENDPOINTS.EMPLOYEE_BY_ID(id), payload),
  remove: (id: string) => api.delete(API_ENDPOINTS.EMPLOYEE_BY_ID(id)),
};
