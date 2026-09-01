import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";

export const authService = {
  login: (email: string, password: string) => api.post(API_ENDPOINTS.LOGIN, { email, password }),
  me: () => api.get(API_ENDPOINTS.AUTH_ME),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.put(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, payload),
};
