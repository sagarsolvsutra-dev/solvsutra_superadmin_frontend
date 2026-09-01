"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiAlertTriangle, FiAlertCircle, FiX } from "react-icons/fi";
import { dashboardService } from "@/services/dashboard.service";
import { getErrorMessage } from "@/lib/api";

interface ExpirySummary {
  expiringCount: number;
  expiredCount: number;
  criticalCount: number;
}

export const SubscriptionExpiryBanner = () => {
  const pathname = usePathname();
  const [summary, setSummary] = useState<ExpirySummary | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .widgets()
      .then((res) => setSummary(res.data.widgets?.summary ?? null))
      .catch((err) => console.error("Banner fetch error:", getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (pathname?.includes("/subscription")) return null;
  if (loading || dismissed || !summary) return null;
  if (summary.expiredCount === 0 && summary.criticalCount === 0) return null;

  // Expired subscriptions take priority (red)
  if (summary.expiredCount > 0) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
          <FiAlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-900">
            {summary.expiredCount} Subscription{summary.expiredCount > 1 ? "s" : ""} Expired
          </p>
          <p className="text-sm text-red-700">
            Immediate attention required. {summary.criticalCount > 0 && `${summary.criticalCount} more critical (≤7 days). `}
            <Link href="/subscriptions" className="font-medium underline hover:text-red-800">
              View Subscriptions
            </Link>
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-100" title="Dismiss">
          <FiX className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Critical (≤7 days) - amber
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <FiAlertTriangle className="h-5 w-5 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-amber-900">{summary.criticalCount} Critical: Expires in ≤7 Days</p>
        <p className="text-sm text-amber-700">
          {summary.expiringCount} total expiring soon.{" "}
          <Link href="/subscriptions" className="font-medium underline hover:text-amber-800">
            View Subscriptions
          </Link>
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="rounded-lg p-2 text-amber-600 transition-colors hover:bg-amber-100" title="Dismiss">
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
};
