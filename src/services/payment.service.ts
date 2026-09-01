import { api } from "@/lib/api";
import { API_ENDPOINTS } from "./endpoints";
import { normalizeList } from "./normalize";
import type { ListParams } from "./types";
import type { Payment } from "@/types";

export const paymentService = {
  list: (params?: ListParams) => api.get(API_ENDPOINTS.PAYMENTS, { params }).then(normalizeList<Payment>("payments")),
  stats: () => api.get(API_ENDPOINTS.PAYMENT_STATS),
  get: (id: string) => api.get(API_ENDPOINTS.PAYMENT_BY_ID(id)),
  createOrder: (payload: { subscriptionId: string; planId: string }) => api.post(API_ENDPOINTS.PAYMENT_CREATE_ORDER, payload),
  verify: (payload: Record<string, unknown>) => api.post(API_ENDPOINTS.PAYMENT_VERIFY, payload),
};
