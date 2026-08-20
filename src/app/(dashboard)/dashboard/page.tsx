"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  FolderKanban,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import api from "@/lib/apiClient";
import { Skeleton } from "@/components/ui/Skeleton";

interface DashboardStats {
  clients: { total: number; active: number; inactive: number; suspended: number };
  projects: { total: number; active: number; inactive: number; suspended: number };
  subscriptions: { total: number; active: number; expiring: number; expired: number; gracePeriod: number; suspended: number; expiringIn30: number };
  payments: { total: number; success: number; pending: number; failed: number; totalRevenue: number; monthlyRevenue: number };
}

interface RecentItem {
  _id: string;
  companyName?: string;
  projectName?: string;
  amount?: number;
  status?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentClients, setRecentClients] = useState<RecentItem[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentItem[]>([]);
  const [expiringProjects, setExpiringProjects] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes] = await Promise.all([api.getDashboard()]);
      setStats(dashboardRes.stats);
      setRecentClients(dashboardRes.widgets?.recentClients || []);
      setRecentPayments(dashboardRes.widgets?.recentPayments || []);
      setExpiringProjects(dashboardRes.widgets?.expiringProjects || []);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statCards = [
    {
      title: "Total Clients",
      value: stats?.clients.total || 0,
      icon: Users,
      color: "blue",
      subtext: `${stats?.clients.active || 0} active`,
    },
    {
      title: "Total Projects",
      value: stats?.projects.total || 0,
      icon: FolderKanban,
      color: "purple",
      subtext: `${stats?.projects.active || 0} active`,
    },
    {
      title: "Active Subscriptions",
      value: stats?.subscriptions.active || 0,
      icon: CreditCard,
      color: "green",
      subtext: `${stats?.subscriptions.expiring || 0} expiring`,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.payments.totalRevenue || 0),
      icon: DollarSign,
      color: "emerald",
      subtext: `${formatCurrency(stats?.payments.monthlyRevenue || 0)} this month`,
    },
  ];

  const statusCards = [
    { label: "Active Projects", value: stats?.projects.active || 0, color: "text-green-600", bg: "bg-green-50" },
    { label: "Expiring Soon", value: stats?.subscriptions.expiring || 0, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "In Grace Period", value: stats?.subscriptions.gracePeriod || 0, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Expired", value: stats?.subscriptions.expired || 0, color: "text-red-600", bg: "bg-red-50" },
    { label: "Suspended", value: stats?.subscriptions.suspended || 0, color: "text-gray-600", bg: "bg-gray-100" },
    { label: "Pending Payments", value: stats?.payments.pending || 0, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  const colorClasses = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    emerald: "bg-emerald-500",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your SolvSutra system</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{card.title}</span>
                <div className={`p-2 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]} bg-opacity-10`}>
                  <card.icon className={`w-5 h-5 ${colorClasses[card.color as keyof typeof colorClasses].replace("bg-", "text-")}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{card.value}</div>
              <div className="text-xs text-gray-500">{card.subtext}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Subscription Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statusCards.map((card) => (
            <div key={card.label} className={`${card.bg} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-gray-600 mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Clients</h2>
            <a href="/clients" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : recentClients.length > 0 ? (
              recentClients.slice(0, 5).map((client) => (
                <div key={client._id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {(client as any).companyName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{(client as any).companyName}</p>
                    <p className="text-xs text-gray-500">{formatDate((client as any).createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">No recent clients</div>
            )}
          </div>
        </div>

        {/* Expiring Projects */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Expiring Soon</h2>
            <a href="/subscriptions" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : expiringProjects.length > 0 ? (
              expiringProjects.slice(0, 5).map((project) => (
                <div key={project._id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{(project as any).projectName}</p>
                    <p className="text-xs text-amber-600">
                      Expires: {formatDate((project as any).expiryDate)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">No expiring projects</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Payments</h2>
          <a href="/payments" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Project</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : recentPayments.length > 0 ? (
                recentPayments.slice(0, 5).map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-900">{(payment as any).clientName}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{(payment as any).projectName}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{formatCurrency(payment.amount || 0)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === "success"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {payment.status === "success" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {payment.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                        {payment.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{formatDate(payment.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">No recent payments</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
