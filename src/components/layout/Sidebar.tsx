"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiX, FiChevronDown, FiShield } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./navConfig";

const STORAGE_KEY = "solvsutra-superadmin-sidebar-groups";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let initial: Record<string, boolean> = {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) initial = JSON.parse(stored);
    } catch {
      // ignore malformed storage
    }
    NAV_GROUPS.forEach((g) => {
      if (!(g.id in initial)) initial[g.id] = true;
    });
    // Always expand the group containing the active route.
    const activeGroup = NAV_GROUPS.find((g) => g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/")));
    if (activeGroup) initial[activeGroup.id] = true;
    setOpenGroups(initial);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
              <FiShield className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-semibold text-slate-900">SolvSutra</span>
          </Link>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const isOpen = !hydrated || openGroups[group.id] !== false;
            return (
              <div key={group.id} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider text-slate-800">
                    {group.title}
                  </span>
                  <FiChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="mt-1 flex flex-col gap-0.5 pb-3">
                    {group.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors",
                            active ? "bg-indigo-50 text-indigo-700" : "text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", active ? "text-indigo-600" : "text-slate-400")} />
                          <span className={cn("min-w-0 truncate text-sm font-semibold", active ? "text-indigo-700" : "text-slate-900")}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
