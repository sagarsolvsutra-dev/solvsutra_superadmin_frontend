"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiUsers,
  FiFolder,
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiArrowUpRight,
  FiAlertTriangle,
} from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, StatCard } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { StatCardsSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { dashboardService } from "@/services/dashboard.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface ExpiringItem {
  _id: string;
  expiryDate: string;
  daysRemaining: number;
  planId?: { name: string };
  clientId?: { companyName: string };
  projectId?: { projectName: string };
}

interface ExpiredItem {
  _id: string;
  expiryDate: string;
  daysExpired: number;
  planId?: { name: string };
  clientId?: { companyName: string };
  projectId?: { projectName: string };
}

interface RecentClient {
  _id: string;
  companyName: string;
  createdAt: string;
}

interface RecentPayment {
  _id: string;
  amount: number;
  status: string;
  paidAt?: string;
  createdAt: string;
  clientId?: { companyName: string };
  projectId?: { projectName: string };
}

const daysRemainingTone = (days: number) => {
  if (days <= 0) return { label: "Expired", tone: "bg-red-100 text-red-700", icon: FiXCircle };
  if (days <= 7) return { label: `${days}d left`, tone: "bg-orange-100 text-orange-700", icon: FiAlertTriangle };
  if (days <= 30) return { label: `${days}d left`, tone: "bg-amber-100 text-amber-700", icon: FiClock };
  return { label: `${days}d left`, tone: "bg-emerald-100 text-emerald-700", icon: FiCheckCircle };
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [expiringProjects, setExpiringProjects] = useState<ExpiringItem[]>([]);
  const [expiredProjects, setExpiredProjects] = useState<ExpiredItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardService.stats(), dashboardService.widgets()])
      .then(([statsRes, widgetsRes]) => {
        setStats(statsRes.data.stats);
        setRecentClients(widgetsRes.data.widgets?.recentClients || []);
        setRecentPayments(widgetsRes.data.widgets?.recentPayments || []);
        setExpiringProjects(widgetsRes.data.widgets?.expiringProjects || []);
        setExpiredProjects(widgetsRes.data.widgets?.expiredProjects || []);
      })
      .catch((err) => console.error("Failed to fetch dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const statusChips = [
    { label: "Active Projects", value: stats?.projects.active || 0, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Expiring Soon", value: stats?.subscriptions.expiring || 0, tone: "text-amber-600 bg-amber-50" },
    { label: "In Grace Period", value: stats?.subscriptions.gracePeriod || 0, tone: "text-orange-600 bg-orange-50" },
    { label: "Expired", value: stats?.subscriptions.expired || 0, tone: "text-red-600 bg-red-50" },
    { label: "Suspended", value: stats?.subscriptions.suspended || 0, tone: "text-slate-600 bg-slate-100" },
    { label: "Pending Payments", value: stats?.payments.pending || 0, tone: "text-sky-600 bg-sky-50" },
  ];

  const paymentColumns: Column<RecentPayment>[] = [
    { header: "Client", render: (p) => p.clientId?.companyName || "-" },
    { header: "Project", render: (p) => p.projectId?.projectName || "-" },
    { header: "Amount", render: (p) => formatCurrency(p.amount) },
    {
      header: "Status",
      render: (p) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            p.status === "success" ? "bg-emerald-100 text-emerald-700" : p.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
          }`}
        >
          {p.status}
        </span>
      ),
    },
    { header: "Date", render: (p) => formatDate(p.paidAt || p.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your SolvSutra system" />

      {loading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Clients" value={stats?.clients.total || 0} icon={<FiUsers className="h-5 w-5" />} tone="indigo" hint={`${stats?.clients.active || 0} active`} />
          <StatCard label="Total Projects" value={stats?.projects.total || 0} icon={<FiFolder className="h-5 w-5" />} tone="sky" hint={`${stats?.projects.active || 0} active`} />
          <StatCard
            label="Active Subscriptions"
            value={stats?.subscriptions.active || 0}
            icon={<FiCreditCard className="h-5 w-5" />}
            tone="emerald"
            hint={`${stats?.subscriptions.expiring || 0} expiring`}
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats?.payments.totalRevenue || 0)}
            icon={<FiDollarSign className="h-5 w-5" />}
            tone="amber"
            hint={`${formatCurrency(stats?.payments.monthlyRevenue || 0)} this month`}
          />
        </div>
      )}

      <Card className="mb-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Subscription Status Overview</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {statusChips.map((chip) => (
            <div key={chip.label} className={`rounded-lg p-3 text-center ${chip.tone}`}>
              <div className="text-2xl font-bold">{chip.value}</div>
              <div className="mt-1 text-xs text-slate-600">{chip.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="!p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Clients</h2>
            <Link href="/clients" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
              View all <FiArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-5">
                <CardSkeleton lines={3} />
              </div>
            ) : recentClients.length > 0 ? (
              recentClients.slice(0, 5).map((client) => (
                <div key={client._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-semibold text-white">
                    {client.companyName?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{client.companyName}</p>
                    <p className="text-xs text-slate-500">{formatDate(client.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No recent clients</div>
            )}
          </div>
        </Card>

        <Card className="!p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Expiring Soon</h2>
              {expiringProjects.length > 0 && (
                <p className="mt-0.5 text-xs text-amber-600">
                  {expiringProjects.length} project{expiringProjects.length > 1 ? "s" : ""} expiring in 30 days
                </p>
              )}
            </div>
            <Link href="/subscriptions" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
              View all <FiArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-5">
                <CardSkeleton lines={3} />
              </div>
            ) : expiringProjects.length > 0 ? (
              expiringProjects.slice(0, 5).map((sub) => {
                const badge = daysRemainingTone(sub.daysRemaining || 0);
                const BadgeIcon = badge.icon;
                return (
                  <div key={sub._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${badge.tone}`}>
                      <BadgeIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">{sub.projectId?.projectName || "Unknown Project"}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.tone}`}>{badge.label}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {sub.clientId?.companyName} • Plan: {sub.planId?.name}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-600">Expires: {formatDate(sub.expiryDate)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No expiring projects</div>
            )}
          </div>
        </Card>
      </div>

      {expiredProjects.length > 0 && (
        <Card className="mb-6 !p-0 overflow-hidden border-2 border-red-200">
          <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-center gap-2">
              <FiXCircle className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-semibold text-red-900">Expired Subscriptions ({expiredProjects.length})</h2>
            </div>
            <Link href="/subscriptions" className="flex items-center gap-1 text-sm text-red-700 hover:text-red-800">
              View all <FiArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-red-100">
            {expiredProjects.map((sub) => (
              <div key={sub._id} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                  <FiXCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{sub.projectId?.projectName || "Unknown Project"}</p>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Expired {sub.daysExpired}d ago</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {sub.clientId?.companyName} • Plan: {sub.planId?.name}
                  </p>
                  <p className="mt-0.5 text-xs text-red-600">Expired on: {formatDate(sub.expiryDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="!p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recent Payments</h2>
          <Link href="/payments" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
            View all <FiArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="p-5">
          <Table columns={paymentColumns} data={recentPayments.slice(0, 5)} loading={loading} emptyMessage="No recent payments" />
        </div>
      </Card>
    </div>
  );
}
