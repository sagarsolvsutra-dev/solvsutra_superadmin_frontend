"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/apiClient";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Payment {
  _id: string;
  paymentId: string;
  clientId: { _id: string; companyName: string };
  projectId: { _id: string; projectName: string };
  planId: { _id: string; name: string };
  amount: number;
  currency: string;
  status: "created" | "pending" | "success" | "failed" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getPayments(statusFilter ? `status=${statusFilter}` : "");
      setPayments(res.payments);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any; label: string }> = {
      success: { variant: "success", icon: CheckCircle, label: "Success" },
      pending: { variant: "warning", icon: Clock, label: "Pending" },
      failed: { variant: "danger", icon: XCircle, label: "Failed" },
      refunded: { variant: "gray", icon: RefreshCw, label: "Refunded" },
      created: { variant: "info", icon: Clock, label: "Created" },
    };
    const c = config[status] || { variant: "default", icon: Clock, label: status };
    return (
      <Badge variant={c.variant}>
        <c.icon className="w-3 h-3 mr-1" />
        {c.label}
      </Badge>
    );
  };

  const columns: Column<Payment>[] = [
    { key: "paymentId", header: "Payment ID" },
    { key: "clientName", header: "Client", render: (row) => (row.clientId as any)?.companyName },
    { key: "projectName", header: "Project", render: (row) => (row.projectId as any)?.projectName },
    { key: "planName", header: "Plan", render: (row) => (row.planId as any)?.name },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-gray-900">{formatCurrency(row.amount, row.currency)}</span>
      ),
    },
    { key: "status", header: "Status", render: (row) => getStatusBadge(row.status) },
    {
      key: "razorpayOrderId",
      header: "Razorpay Order",
      render: (row) => (
        <span className="text-xs font-mono text-gray-500">{row.razorpayOrderId || "-"}</span>
      ),
    },
    {
      key: "paidAt",
      header: "Paid At",
      render: (row) =>
        row.paidAt ? new Date(row.paidAt).toLocaleString("en-IN") : "-",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">View all payment transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchPayments()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Select
            label="Status"
            placeholder="All Status"
            options={[
              { value: "", label: "All Status" },
              { value: "success", label: "Success" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
            ]}
            selectedValue={statusFilter}
            onChange={setStatusFilter}
            className="w-48"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={10} cols={8} />
      ) : (
        <Table columns={columns} data={payments} />
      )}
    </div>
  );
}
