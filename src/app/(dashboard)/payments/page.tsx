"use client";

import { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { paymentService } from "@/services/payment.service";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { RowActions, ViewAction } from "@/components/ui/RowActions";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Payment, Client, Project, Plan, Subscription } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "created", label: "Created" },
  { value: "pending", label: "Pending" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

function asClient(v: Payment["clientId"]): Client | null {
  return typeof v === "object" && v ? v : null;
}
function asProject(v: Payment["projectId"]): Project | null {
  return typeof v === "object" && v ? v : null;
}
function asPlan(v: Payment["planId"]): Plan | null {
  return typeof v === "object" && v ? v : null;
}
function asSubscription(v: Payment["subscriptionId"]): Subscription | null {
  return typeof v === "object" && v ? v : null;
}

function formatAmount(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  const { items, pages, loading, refetch } = usePaginatedList(paymentService.list, {
    page,
    limit: 10,
    extraParams: { status: statusFilter },
  });

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const columns: Column<Payment>[] = [
    {
      header: "Payment ID",
      render: (row) => <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{row.paymentId}</span>,
    },
    { header: "Client", render: (row) => asClient(row.clientId)?.companyName ?? "-" },
    { header: "Project", render: (row) => asProject(row.projectId)?.projectName ?? "-" },
    { header: "Plan", render: (row) => asPlan(row.planId)?.name ?? "-" },
    {
      header: "Amount",
      align: "right",
      render: (row) => <span className="font-semibold text-slate-900">{formatAmount(row.amount, row.currency)}</span>,
    },
    { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { header: "Method", render: (row) => row.paymentMethod || "-" },
    { header: "Paid At", render: (row) => formatDateTime(row.paidAt) },
    { header: "Created", render: (row) => formatDate(row.createdAt) },
    {
      header: "Actions",
      align: "center",
      render: (row) => (
        <RowActions>
          <ViewAction onClick={() => setViewPayment(row)} title="View details" />
        </RowActions>
      ),
    },
  ];

  const viewClient = viewPayment ? asClient(viewPayment.clientId) : null;
  const viewProject = viewPayment ? asProject(viewPayment.projectId) : null;
  const viewPlan = viewPayment ? asPlan(viewPayment.planId) : null;
  const viewSubscription = viewPayment ? asSubscription(viewPayment.subscriptionId) : null;

  return (
    <div>
      <PageHeader
        title="Payments"
        description="View all payment transactions"
        actions={
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
            <FiRefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Select
          label="Status"
          placeholder="All Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          wrapperClassName="w-48"
        />
      </div>

      <Table
        columns={columns}
        data={items}
        loading={loading}
        keyField={(row) => row._id}
        emptyMessage="No payments found"
        pagination={{ currentPage: page, totalPages: pages, onPageChange: setPage }}
      />

      <Dialog
        open={!!viewPayment}
        onClose={() => setViewPayment(null)}
        title="Payment Details"
        description={viewPayment?.paymentId}
        size="md"
      >
        {viewPayment && (
          <div className="space-y-3 text-sm">
            <DetailRow label="Client" value={viewClient?.companyName ?? "-"} />
            <DetailRow label="Project" value={viewProject?.projectName ?? "-"} />
            <DetailRow label="Plan" value={viewPlan?.name ?? "-"} />
            <DetailRow
              label="Subscription"
              value={viewSubscription?.subscriptionId ?? (typeof viewPayment.subscriptionId === "string" ? viewPayment.subscriptionId : "-")}
            />
            <DetailRow label="Amount" value={formatAmount(viewPayment.amount, viewPayment.currency)} />
            <DetailRow label="Status" value={<StatusBadge status={viewPayment.status} />} />
            <DetailRow label="Method" value={viewPayment.paymentMethod || "-"} />
            <DetailRow label="Razorpay Order ID" value={<span className="font-mono text-xs">{viewPayment.razorpayOrderId || "-"}</span>} />
            <DetailRow
              label="Razorpay Payment ID"
              value={<span className="font-mono text-xs">{viewPayment.razorpayPaymentId || "-"}</span>}
            />
            {viewPayment.status === "failed" && <DetailRow label="Failure Reason" value={viewPayment.failureReason || "-"} />}
            <DetailRow label="Paid At" value={formatDateTime(viewPayment.paidAt)} />
            <DetailRow label="Created" value={formatDateTime(viewPayment.createdAt)} />
          </div>
        )}
      </Dialog>
    </div>
  );
}
