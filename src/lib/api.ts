import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { API_ENDPOINTS } from "@/services/endpoints";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export const HEALTH_CHECK = API_BASE_URL.replace("/api", "/health");
// socket.io connects to the bare server origin (its own /socket.io/
// transport, not an /api route) — same host as HEALTH_CHECK, just without
// a path.
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const logoutAndRedirect = () => {
  useAuthStore.getState().clearAuth();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const isLoginEndpoint = originalRequest?.url === API_ENDPOINTS.LOGIN;
    // A 401 from change-password means "current password is incorrect" — a
    // business-logic rejection, not a signal the session itself is invalid.
    const isChangePasswordEndpoint = originalRequest?.url === API_ENDPOINTS.AUTH_CHANGE_PASSWORD;

    if (error.response?.status === 401 && !isLoginEndpoint && !isChangePasswordEndpoint) {
      logoutAndRedirect();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || "Something went wrong";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
