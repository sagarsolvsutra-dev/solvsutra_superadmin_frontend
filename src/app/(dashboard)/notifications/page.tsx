"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiBell, FiCheck, FiCheckCircle, FiAlertTriangle, FiXCircle, FiRefreshCw, FiEye, FiTrash2 } from "react-icons/fi";
import { notificationService } from "@/services/notification.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import type { Notification } from "@/types";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; iconClass: string; bgClass: string }> = {
  expiry_warning: { icon: FiAlertTriangle, iconClass: "text-amber-500", bgClass: "bg-amber-50" },
  expired: { icon: FiXCircle, iconClass: "text-red-500", bgClass: "bg-red-50" },
  payment_success: { icon: FiCheckCircle, iconClass: "text-emerald-500", bgClass: "bg-emerald-50" },
  payment_failed: { icon: FiXCircle, iconClass: "text-red-500", bgClass: "bg-red-50" },
  subscription_renewed: { icon: FiCheckCircle, iconClass: "text-emerald-500", bgClass: "bg-emerald-50" },
  subscription_created: { icon: FiCheckCircle, iconClass: "text-emerald-500", bgClass: "bg-emerald-50" },
  subscription_suspended: { icon: FiAlertTriangle, iconClass: "text-red-500", bgClass: "bg-red-50" },
  suspension: { icon: FiAlertTriangle, iconClass: "text-red-500", bgClass: "bg-red-50" },
};

const DEFAULT_TYPE_CONFIG = { icon: FiBell, iconClass: "text-sky-500", bgClass: "bg-sky-50" };

// Types that also get a status-style badge next to the title, matching what
// the original page called out as "expiry related" notifications.
const EXPIRY_TYPES = new Set(["expiry_warning", "expired", "suspension"]);

const TYPE_LABEL: Record<string, string> = {
  expiry_warning: "Expiry Warning",
  expired: "Expired",
  suspension: "Suspended",
};

function typeBadgeTone(type: string): "danger" | "warning" | "neutral" {
  if (type === "expired") return "danger";
  if (type === "suspension") return "warning";
  return "neutral";
}

export default function NotificationsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { items, total, pages, loading, refetch } = usePaginatedList(notificationService.list, {
    page,
    limit: 10,
  });

  // The list endpoint is paginated 10-at-a-time, so it can't tell us the
  // total unread count across every notification — that comes from the
  // dedicated unread-count endpoint (the same one the topbar badge uses).
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.unreadCount();
      setUnreadCount(res.data.count ?? 0);
    } catch {
      // Non-critical — per-row unread state below still works without it.
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  useNotificationSocket(() => {
    setUnreadCount((c) => c + 1);
    // Only reshuffle the visible list when it's the newest page — a new row
    // appearing at the top of a page 3+ someone is actively reading would be
    // more disruptive than useful.
    if (page === 1) refetch();
  });

  const markAsRead = async (notification: Notification) => {
    if (notification.isRead) return;
    setMarkingId(notification._id);
    try {
      await notificationService.markAsRead(notification._id);
      setUnreadCount((c) => Math.max(0, c - 1));
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      await refetch();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await notificationService.remove(deleteTarget._id);
      if (!deleteTarget.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      toast.success("Notification deleted");
      setDeleteTarget(null);
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "All caught up"}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" icon={<FiCheck className="h-4 w-4" />} onClick={markAllAsRead} loading={markingAll}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <FiBell className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No notifications</p>
          </div>
        ) : (
          items.map((notification) => {
            const { icon: Icon, iconClass, bgClass } = TYPE_CONFIG[notification.type] ?? DEFAULT_TYPE_CONFIG;
            const isExpiryRelated = EXPIRY_TYPES.has(notification.type);

            return (
              <div
                key={notification._id}
                className={cn("flex items-start gap-4 p-4 transition-colors", !notification.isRead && "bg-brand-50/40")}
              >
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", bgClass)}>
                  <Icon className={cn("h-5 w-5", iconClass)} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={cn("text-sm", notification.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900")}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    {isExpiryRelated && (
                      <Badge tone={typeBadgeTone(notification.type)}>{TYPE_LABEL[notification.type] ?? notification.type}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>

                  {notification.data?.daysRemaining !== undefined && (
                    <p className="mt-1 text-xs text-amber-600">
                      Expires in {notification.data.daysRemaining} day{notification.data.daysRemaining === 1 ? "" : "s"}
                      {notification.data.planName && ` • Plan: ${notification.data.planName}`}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(notification.createdAt)}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {isExpiryRelated && notification.subscriptionId && (
                    <>
                      <Link
                        href={`/subscriptions?highlight=${notification.subscriptionId}`}
                        className="rounded-lg p-2 text-brand-600 transition-colors hover:bg-brand-50"
                        title="View subscription"
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/subscriptions"
                        className="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-50"
                        title="Renew now"
                      >
                        <FiRefreshCw className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Mark as read"
                      loading={markingId === notification._id}
                      onClick={() => markAsRead(notification)}
                    >
                      <FiCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteTarget(notification)}>
                    <FiTrash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && items.length > 0 && <Pagination page={page} pages={pages} total={total} onPageChange={setPage} limit={10} />}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete notification"
        description={deleteTarget ? `Delete "${deleteTarget.title}"? This action cannot be undone.` : undefined}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
