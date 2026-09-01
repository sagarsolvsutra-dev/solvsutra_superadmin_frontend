/**
 * Single source of truth for every backend API path used by the frontend.
 * All `*.service.ts` files build their requests from here — no other file
 * should hardcode a `"/..."` path string when calling `api`.
 *
 * Paths are relative (the `api` axios instance in `lib/api.ts` already
 * carries the base URL), and any endpoint that needs a dynamic id/segment
 * is a small function instead of a plain string.
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  AUTH_ME: "/auth/me",
  AUTH_CHANGE_PASSWORD: "/auth/change-password",
  AUTH_REGISTER: "/auth/register",

  // Staff users (registered via AUTH_REGISTER, listed/edited/deleted under /auth/users)
  USERS: "/auth/users",
  USER_BY_ID: (id: string) => `/auth/users/${id}`,

  // Clients
  CLIENTS: "/clients",
  CLIENT_STATS: "/clients/stats",
  CLIENT_BY_ID: (id: string) => `/clients/${id}`,

  // Projects
  PROJECTS: "/projects",
  PROJECT_STATS: "/projects/stats",
  PROJECT_BY_ID: (id: string) => `/projects/${id}`,
  PROJECT_REGENERATE_CREDENTIALS: (id: string) => `/projects/${id}/regenerate-credentials`,

  // Project team & timeline
  PROJECT_STAFF_SUMMARY: "/projects/staff-summary",
  PROJECT_STAFF: (id: string) => `/projects/${id}/staff`,
  PROJECT_STAFF_BY_ID: (id: string, assignmentId: string) =>
    `/projects/${id}/staff/${assignmentId}`,
  PROJECT_MILESTONES: (id: string) => `/projects/${id}/milestones`,
  PROJECT_MILESTONE_BY_ID: (id: string, milestoneId: string) =>
    `/projects/${id}/milestones/${milestoneId}`,
  USER_PROJECTS: (userId: string) => `/projects/staff/${userId}/projects`,

  // Plans
  PLANS: "/plans",
  PLAN_BY_ID: (id: string) => `/plans/${id}`,

  // Subscriptions
  SUBSCRIPTIONS: "/subscriptions",
  SUBSCRIPTION_STATS: "/subscriptions/stats",
  SUBSCRIPTION_BY_ID: (id: string) => `/subscriptions/${id}`,
  SUBSCRIPTION_RENEW: (id: string) => `/subscriptions/${id}/renew`,
  SUBSCRIPTION_SUSPEND: (id: string) => `/subscriptions/${id}/suspend`,

  // Payments
  PAYMENTS: "/payments",
  PAYMENT_STATS: "/payments/stats",
  PAYMENT_BY_ID: (id: string) => `/payments/${id}`,
  PAYMENT_CREATE_ORDER: "/payments/create-order",
  PAYMENT_VERIFY: "/payments/verify",

  // Notifications
  NOTIFICATIONS: "/notifications",
  NOTIFICATIONS_UNREAD_COUNT: "/notifications/unread-count",
  NOTIFICATIONS_READ_ALL: "/notifications/read-all",
  NOTIFICATION_MARK_READ: (id: string) => `/notifications/${id}/read`,
  NOTIFICATION_BY_ID: (id: string) => `/notifications/${id}`,

  // Activity Logs
  ACTIVITY_LOGS: "/activity-logs",
  ACTIVITY_LOGS_RECENT: "/activity-logs/recent",

  // Servers
  SERVERS: "/servers",
  SERVER_BY_ID: (id: string) => `/servers/${id}`,

  // Domains
  DOMAINS: "/domains",
  DOMAIN_BY_ID: (id: string) => `/domains/${id}`,

  // Employees
  EMPLOYEES: "/employees",
  EMPLOYEE_BY_ID: (id: string) => `/employees/${id}`,

  // Dashboard
  DASHBOARD: "/dashboard",
  DASHBOARD_WIDGETS: "/dashboard/widgets",
} as const;
