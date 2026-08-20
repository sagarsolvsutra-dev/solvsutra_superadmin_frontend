import { toast } from "sonner";
import { API_ENDPOINTS } from "./api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sa_token");
}

async function request<T = any>(
  url: string,
  options: RequestInit = {},
  showErrorToast: boolean = true
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sa_token");
      localStorage.removeItem("sa_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw new Error("Session expired. Please login again.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "An error occurred" }));
    const message = errorData.message || `HTTP ${res.status}`;
    if (showErrorToast) {
      toast.error(message);
    }
    throw new Error(message);
  }

  return res.json();
}

const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ success: boolean; token: string; user: any }>(
      API_ENDPOINTS.LOGIN,
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  getMe: () => request<{ success: boolean; user: any }>(API_ENDPOINTS.ME),
  register: (data: any) =>
    request<{ success: boolean; user: any }>(API_ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean }>(API_ENDPOINTS.CHANGE_PASSWORD, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Users
  getUsers: (params?: string) =>
    request<{ success: boolean; users: any[] }>(
      params ? `${API_ENDPOINTS.USERS}?${params}` : API_ENDPOINTS.USERS
    ),
  createUser: (data: any) =>
    request<{ success: boolean; user: any }>(API_ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    request<{ success: boolean; user: any }>(`${API_ENDPOINTS.USERS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean }>(`${API_ENDPOINTS.USERS}/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboard: () => request<{ success: boolean; stats: any; widgets: any }>(API_ENDPOINTS.DASHBOARD),
  getDashboardWidgets: () => request<{ success: boolean; widgets: any }>(API_ENDPOINTS.DASHBOARD_WIDGETS),

  // Clients
  getClients: (params?: string) =>
    request<{ success: boolean; clients: any[]; total: number; page: number; pages: number }>(
      params ? `${API_ENDPOINTS.CLIENTS}?${params}` : API_ENDPOINTS.CLIENTS
    ),
  getClient: (id: string) =>
    request<{ success: boolean; client: any; projects: any[]; subscriptions: any[]; payments: any[] }>(
      `${API_ENDPOINTS.CLIENTS}/${id}`
    ),
  createClient: (data: any) =>
    request<{ success: boolean; client: any }>(API_ENDPOINTS.CLIENTS, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateClient: (id: string, data: any) =>
    request<{ success: boolean; client: any }>(`${API_ENDPOINTS.CLIENTS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteClient: (id: string) =>
    request<{ success: boolean }>(`${API_ENDPOINTS.CLIENTS}/${id}`, { method: "DELETE" }),

  // Projects
  getProjects: (params?: string) =>
    request<{ success: boolean; projects: any[]; total: number; page: number; pages: number }>(
      params ? `${API_ENDPOINTS.PROJECTS}?${params}` : API_ENDPOINTS.PROJECTS
    ),
  getProject: (id: string) =>
    request<{ success: boolean; project: any; subscription: any }>(`${API_ENDPOINTS.PROJECTS}/${id}`),
  createProject: (data: any) =>
    request<{ success: boolean; project: any }>(API_ENDPOINTS.PROJECTS, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: any) =>
    request<{ success: boolean; project: any }>(`${API_ENDPOINTS.PROJECTS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<{ success: boolean }>(`${API_ENDPOINTS.PROJECTS}/${id}`, { method: "DELETE" }),
  regenerateCredentials: (id: string) =>
    request<{ success: boolean; project: any }>(`${API_ENDPOINTS.PROJECTS}/${id}/regenerate-credentials`, {
      method: "POST",
    }),

  // Plans
  getPlans: (params?: string) =>
    request<{ success: boolean; plans: any[]; total: number }>(
      params ? `${API_ENDPOINTS.PLANS}?${params}` : API_ENDPOINTS.PLANS
    ),
  getPlan: (id: string) => request<{ success: boolean; plan: any }>(`${API_ENDPOINTS.PLANS}/${id}`),
  createPlan: (data: any) =>
    request<{ success: boolean; plan: any }>(API_ENDPOINTS.PLANS, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePlan: (id: string, data: any) =>
    request<{ success: boolean; plan: any }>(`${API_ENDPOINTS.PLANS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePlan: (id: string) =>
    request<{ success: boolean }>(`${API_ENDPOINTS.PLANS}/${id}`, { method: "DELETE" }),

  // Subscriptions
  getSubscriptions: (params?: string) =>
    request<{ success: boolean; subscriptions: any[]; total: number; page: number; pages: number }>(
      params ? `${API_ENDPOINTS.SUBSCRIPTIONS}?${params}` : API_ENDPOINTS.SUBSCRIPTIONS
    ),
  getSubscription: (id: string) =>
    request<{ success: boolean; subscription: any }>(`${API_ENDPOINTS.SUBSCRIPTIONS}/${id}`),
  createSubscription: (data: any) =>
    request<{ success: boolean; subscription: any }>(API_ENDPOINTS.SUBSCRIPTIONS, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSubscription: (id: string, data: any) =>
    request<{ success: boolean; subscription: any }>(`${API_ENDPOINTS.SUBSCRIPTIONS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  renewSubscription: (id: string, data: any) =>
    request<{ success: boolean; subscription: any }>(`${API_ENDPOINTS.SUBSCRIPTIONS}/${id}/renew`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  suspendSubscription: (id: string) =>
    request<{ success: boolean }>(`${API_ENDPOINTS.SUBSCRIPTIONS}/${id}/suspend`, {
      method: "POST",
    }),

  // Payments
  getPayments: (params?: string) =>
    request<{ success: boolean; payments: any[]; total: number; page: number; pages: number }>(
      params ? `${API_ENDPOINTS.PAYMENTS}?${params}` : API_ENDPOINTS.PAYMENTS
    ),
  getPayment: (id: string) =>
    request<{ success: boolean; payment: any }>(`${API_ENDPOINTS.PAYMENTS}/${id}`),
  createOrder: (data: { subscriptionId: string; planId: string }) =>
    request<{ success: boolean; order: any }>(API_ENDPOINTS.CREATE_ORDER, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  verifyPayment: (data: any) =>
    request<{ success: boolean; payment: any }>(API_ENDPOINTS.VERIFY_PAYMENT, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: (params?: string) =>
    request<{ success: boolean; notifications: any[]; unreadCount: number; total: number }>(
      params ? `${API_ENDPOINTS.NOTIFICATIONS}?${params}` : API_ENDPOINTS.NOTIFICATIONS
    ),
  markNotificationAsRead: (id: string) =>
    request<{ success: boolean }>(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`, { method: "PUT" }),
  markAllNotificationsAsRead: () =>
    request<{ success: boolean }>(`${API_ENDPOINTS.NOTIFICATIONS}/read-all`, { method: "PUT" }),
  deleteNotification: (id: string) =>
    request<{ success: boolean }>(`${API_ENDPOINTS.NOTIFICATIONS}/${id}`, { method: "DELETE" }),

  // Activity Logs
  getActivityLogs: (params?: string) =>
    request<{ success: boolean; logs: any[]; total: number }>(
      params ? `${API_ENDPOINTS.ACTIVITY_LOGS}?${params}` : API_ENDPOINTS.ACTIVITY_LOGS
    ),
  getRecentActivity: () =>
    request<{ success: boolean; logs: any[] }>(API_ENDPOINTS.ACTIVITY_LOGS_RECENT),

  // Servers
  getServers: (params?: string) =>
    request<{ success: boolean; servers: any[]; total: number }>(
      params ? `${API_ENDPOINTS.SERVERS}?${params}` : API_ENDPOINTS.SERVERS
    ),
  createServer: (data: any) =>
    request<{ success: boolean; server: any }>(API_ENDPOINTS.SERVERS, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateServer: (id: string, data: any) =>
    request<{ success: boolean; server: any }>(`${API_ENDPOINTS.SERVERS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteServer: (id: string) =>
    request<{ success: boolean }>(`${API_ENDPOINTS.SERVERS}/${id}`, { method: "DELETE" }),

  // Domains
  getDomains: (params?: string) =>
    request<{ success: boolean; domains: any[]; total: number }>(
      params ? `${API_ENDPOINTS.DOMAINS}?${params}` : API_ENDPOINTS.DOMAINS
    ),
  createDomain: (data: any) =>
    request<{ success: boolean; domain: any }>(API_ENDPOINTS.DOMAINS, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateDomain: (id: string, data: any) =>
    request<{ success: boolean; domain: any }>(`${API_ENDPOINTS.DOMAINS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteDomain: (id: string) =>
    request<{ success: boolean }>(`${API_ENDPOINTS.DOMAINS}/${id}`, { method: "DELETE" }),
};

export default api;
