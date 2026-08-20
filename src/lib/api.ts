const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  ME: `${API_BASE_URL}/auth/me`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  USERS: `${API_BASE_URL}/auth/users`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,

  // Dashboard
  DASHBOARD: `${API_BASE_URL}/dashboard`,
  DASHBOARD_WIDGETS: `${API_BASE_URL}/dashboard/widgets`,

  // Clients
  CLIENTS: `${API_BASE_URL}/clients`,
  CLIENT_STATS: `${API_BASE_URL}/clients/stats`,

  // Projects
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECT_STATS: `${API_BASE_URL}/projects/stats`,

  // Plans
  PLANS: `${API_BASE_URL}/plans`,

  // Subscriptions
  SUBSCRIPTIONS: `${API_BASE_URL}/subscriptions`,
  SUBSCRIPTION_STATS: `${API_BASE_URL}/subscriptions/stats`,

  // Payments
  PAYMENTS: `${API_BASE_URL}/payments`,
  PAYMENT_STATS: `${API_BASE_URL}/payments/stats`,
  CREATE_ORDER: `${API_BASE_URL}/payments/create-order`,
  VERIFY_PAYMENT: `${API_BASE_URL}/payments/verify`,

  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  NOTIFICATIONS_UNREAD: `${API_BASE_URL}/notifications/unread-count`,

  // Activity Logs
  ACTIVITY_LOGS: `${API_BASE_URL}/activity-logs`,
  ACTIVITY_LOGS_RECENT: `${API_BASE_URL}/activity-logs/recent`,

  // Servers
  SERVERS: `${API_BASE_URL}/servers`,

  // Domains
  DOMAINS: `${API_BASE_URL}/domains`,
};

export const HEALTH_CHECK = API_BASE_URL.replace('/api', '/health');

export default API_BASE_URL;
