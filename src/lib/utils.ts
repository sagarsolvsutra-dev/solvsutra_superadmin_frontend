import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number | undefined | null): string {
  const num = value ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value: number | undefined | null): string {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(value: string | Date | undefined | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateInputValue(value: string | Date | undefined | null): string {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) return "";
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function daysUntil(date: string | Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Mirrors the backend's `resolveAccess()` (publicSubscriptionController.js) so
 * the admin UI's "is this actually over" read agrees with what locks the
 * client app — computed live from dates, not from the stored `status` field.
 * `expiryCron.js`'s daily sweep is what would normally flip `status` to
 * "expired", but it only runs once a day (or via the manual admin action),
 * so a subscription can sit well past its grace period while `status` still
 * reads "active" — this must not read as healthy just because cron hasn't
 * caught up yet.
 */
export function subscriptionHealth(sub: {
  status: string;
  expiryDate: string;
  gracePeriodEndDate?: string;
}): "expired" | "critical" | null {
  if (sub.status === "suspended" || sub.status === "cancelled") return "expired";

  const now = Date.now();
  const expiry = new Date(sub.expiryDate).getTime();
  if (now > expiry) {
    const graceEnd = sub.gracePeriodEndDate ? new Date(sub.gracePeriodEndDate).getTime() : expiry;
    return now <= graceEnd ? "critical" : "expired";
  }

  return daysUntil(sub.expiryDate) <= 7 ? "critical" : null;
}
