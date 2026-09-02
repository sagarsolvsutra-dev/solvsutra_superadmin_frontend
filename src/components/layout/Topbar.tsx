"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiMenu, FiBell, FiLogOut, FiSettings, FiChevronDown, FiInbox } from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { notificationService } from "@/services/notification.service";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/types";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = (active: { current: boolean } = { current: true }) => {
    notificationService
      .list({ limit: 8 })
      .then((res) => {
        if (!active.current) return;
        setNotifications(res.data.items || []);
      })
      .catch(() => {});
    notificationService
      .unreadCount()
      .then((res) => {
        if (!active.current) return;
        setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const active = { current: true };
    fetchNotifications(active);
    return () => {
      active.current = false;
    };
  }, []);

  useNotificationSocket((notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 8));
    setUnreadCount((c) => c + 1);
    toast.info(notification.message, notification.title);
  });

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleOpenNotif = (n: Notification) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationService.markAsRead(n._id).catch(() => fetchNotifications());
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
    notificationService.markAllAsRead().catch(() => fetchNotifications());
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
        <FiMenu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <FiBell className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500" />}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-100 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                <span className="text-sm font-semibold text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs font-medium text-brand-600 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length ? (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => handleOpenNotif(n)}
                      className={`flex w-full flex-col items-start gap-0.5 border-b border-slate-50 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50 ${
                        n.isRead ? "" : "bg-brand-50/50"
                      }`}
                    >
                      <span className="flex w-full items-center gap-2">
                        {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                        <span className={`text-sm ${n.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>
                          {n.title}
                        </span>
                      </span>
                      <span className="pl-3.5 text-xs text-slate-500">{n.message}</span>
                      <span className="pl-3.5 text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                    <FiInbox className="h-6 w-6 text-slate-300" />
                    <p className="text-xs text-slate-400">No notifications</p>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 px-3 py-2 text-center">
                <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs font-medium text-brand-600 hover:underline">
                  View all
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="text-xs capitalize text-slate-400">{user?.role?.replace("_", " ")}</p>
            </div>
            <FiChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-100 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-700">{user?.name}</p>
                {user?.email && <p className="mt-0.5 truncate text-xs text-slate-400">{user.email}</p>}
              </div>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <FiSettings className="h-4 w-4" /> Settings
              </Link>
              <button onClick={logout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <FiLogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
