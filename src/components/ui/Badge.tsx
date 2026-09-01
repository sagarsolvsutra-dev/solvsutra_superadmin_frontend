import { cn } from "@/lib/utils";

type BadgeTone = "success" | "danger" | "warning" | "info" | "neutral";

const STYLES: Record<BadgeTone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-sky-100 text-sky-700",
  neutral: "bg-slate-100 text-slate-600",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[tone])}>
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  inactive: "neutral",
  suspended: "danger",
  pending: "warning",
  expiring: "warning",
  expired: "danger",
  grace_period: "warning",
  cancelled: "neutral",
  success: "success",
  failed: "danger",
  refunded: "info",
  created: "neutral",
};

/** Renders any of the app's lowercase/underscored status strings (client, project,
 * subscription, payment, server, domain) with a consistent tone + humanized label. */
export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status?.toLowerCase()] ?? "neutral";
  const label = status?.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  return <Badge tone={tone}>{label}</Badge>;
}
