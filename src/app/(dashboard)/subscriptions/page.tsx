"use client";

import { useEffect, useState } from "react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { RowActions, RegenerateAction, CancelAction, EditAction, DeleteAction } from "@/components/ui/RowActions";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { subscriptionService } from "@/services/subscription.service";
import { clientService } from "@/services/client.service";
import { projectService } from "@/services/project.service";
import { planService } from "@/services/plan.service";
import { getErrorMessage } from "@/lib/api";
import { formatDate, subscriptionHealth, toDateInputValue } from "@/lib/utils";
import type { Subscription, Client, Project, Plan } from "@/types";

type SelectOption = { label: string; value: string };

type SubscriptionFormState = {
  clientId: string;
  projectId: string;
  planId: string;
  startDate: string;
  gracePeriodDays: number;
  autoRenew: boolean;
};

const EMPTY_FORM: SubscriptionFormState = {
  clientId: "",
  projectId: "",
  planId: "",
  startDate: "",
  gracePeriodDays: 7,
  autoRenew: false,
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring" },
  { value: "expired", label: "Expired" },
  { value: "grace_period", label: "Grace Period" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
];

const EDIT_STATUS_OPTIONS = STATUS_FILTER_OPTIONS.filter((o) => o.value);
const AUTO_RENEW_OPTIONS = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

type SubscriptionEditForm = {
  clientId: string;
  projectId: string;
  planId: string;
  startDate: string;
  gracePeriodDays: number;
  autoRenew: string;
  status: string;
  notes: string;
};

const EMPTY_EDIT_FORM: SubscriptionEditForm = {
  clientId: "",
  projectId: "",
  planId: "",
  startDate: "",
  gracePeriodDays: 7,
  autoRenew: "false",
  status: "active",
  notes: "",
};

const idOf = (value: string | { _id: string } | undefined) => (typeof value === "object" && value ? value._id : (value as string) || "");

function nameOf<T extends { _id: string }>(value: string | T | undefined, pick: (item: T) => string): string {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return pick(value) || "-";
}

function getDaysRemaining(expiryDate: string) {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** The stored `status` only flips to "expired" once the daily cron sweep runs,
 * so a subscription can be well past its grace period while it still reads
 * "active" — show the live-computed truth instead of that stale value. */
function displayStatus(sub: Subscription): string {
  if (subscriptionHealth(sub) === "expired" && sub.status !== "suspended" && sub.status !== "cancelled") return "expired";
  return sub.status;
}

export default function SubscriptionsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<SubscriptionFormState>(EMPTY_FORM);

  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [planOptions, setPlanOptions] = useState<SelectOption[]>([]);
  const [projectOptions, setProjectOptions] = useState<SelectOption[]>([]);

  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Subscription | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState<SubscriptionEditForm>(EMPTY_EDIT_FORM);
  const [editProjectOptions, setEditProjectOptions] = useState<SelectOption[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const {
    items: subscriptions,
    pages,
    loading,
    refetch,
  } = usePaginatedList(subscriptionService.list, {
    search,
    page,
    limit: 10,
    extraParams: { status: statusFilter || undefined },
  });

  useEffect(() => {
    Promise.all([clientService.list({ limit: 200 }), planService.list({ limit: 200 })])
      .then(([clientsRes, plansRes]) => {
        setClientOptions(clientsRes.data.items.map((c: Client) => ({ value: c._id, label: c.companyName })));
        setPlanOptions(plansRes.data.items.map((p: Plan) => ({ value: p._id, label: `${p.name} - ₹${p.price}` })));
      })
      .catch((err) => toast.error(getErrorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjectsForClient = async (clientId: string, setter: (opts: SelectOption[]) => void) => {
    if (!clientId) {
      setter([]);
      return;
    }
    try {
      const res = await projectService.list({ clientId, limit: 200 });
      setter(res.data.items.map((p: Project) => ({ value: p._id, label: p.projectName })));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setProjectOptions([]);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.projectId || !formData.planId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await subscriptionService.create(formData);
      toast.success("Subscription created successfully");
      closeDialog();
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async () => {
    if (!renewTarget) return;
    setActionSubmitting(true);
    try {
      await subscriptionService.renew(renewTarget._id, {});
      toast.success("Subscription renewed successfully");
      setRenewTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setActionSubmitting(true);
    try {
      await subscriptionService.suspend(suspendTarget._id);
      toast.success("Subscription suspended");
      setSuspendTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionSubmitting(false);
    }
  };

  const openEdit = (row: Subscription) => {
    setEditTarget(row);
    const clientId = idOf(row.clientId);
    setEditForm({
      clientId,
      projectId: idOf(row.projectId),
      planId: idOf(row.planId),
      startDate: toDateInputValue(row.startDate),
      gracePeriodDays: row.gracePeriodDays ?? 7,
      autoRenew: String(row.autoRenew),
      status: row.status,
      notes: row.notes || "",
    });
    fetchProjectsForClient(clientId, setEditProjectOptions);
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;
    if (!editForm.clientId || !editForm.projectId || !editForm.planId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setEditSubmitting(true);
    try {
      await subscriptionService.update(editTarget._id, {
        clientId: editForm.clientId,
        projectId: editForm.projectId,
        planId: editForm.planId,
        startDate: editForm.startDate,
        gracePeriodDays: editForm.gracePeriodDays,
        autoRenew: editForm.autoRenew === "true",
        status: editForm.status,
        notes: editForm.notes,
      });
      toast.success("Subscription updated successfully");
      setEditTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await subscriptionService.remove(deleteTarget._id);
      toast.success("Subscription deleted successfully");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Subscription>[] = [
    { header: "ID", render: (row) => <span className="font-mono text-xs">{row.subscriptionId}</span> },
    { header: "Client", primary: true, render: (row) => nameOf<Client>(row.clientId, (c) => c.companyName) },
    { header: "Project", render: (row) => nameOf<Project>(row.projectId, (p) => p.projectName) },
    { header: "Plan", render: (row) => nameOf<Plan>(row.planId, (p) => p.name) },
    {
      header: "Expiry",
      render: (row) => {
        const days = getDaysRemaining(row.expiryDate);
        return (
          <div>
            <div>{formatDate(row.expiryDate)}</div>
            <div
              className={`text-xs ${
                days <= 7 ? "font-medium text-red-500" : days <= 30 ? "text-amber-500" : "text-slate-500"
              }`}
            >
              {days > 0 ? `${days} days left` : "Expired"}
            </div>
          </div>
        );
      },
    },
    { header: "Status", render: (row) => <StatusBadge status={displayStatus(row)} /> },
    { header: "Renewals", align: "center", render: (row) => row.renewalCount },
    {
      header: "Actions",
      align: "center",
      render: (row) => (
        <RowActions>
          <RegenerateAction title="Renew" onClick={() => setRenewTarget(row)} disabled={row.status === "cancelled"} />
          <CancelAction
            title="Suspend"
            onClick={() => setSuspendTarget(row)}
            disabled={row.status === "suspended" || row.status === "cancelled"}
          />
          <EditAction onClick={() => openEdit(row)} />
          <DeleteAction onClick={() => setDeleteTarget(row)} />
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Manage client subscriptions"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
              <FiRefreshCw className="h-4 w-4" />
            </Button>
            <Button icon={<FiPlus className="h-4 w-4" />} onClick={() => setIsDialogOpen(true)}>
              New Subscription
            </Button>
          </div>
        }
      />

      <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search subscriptions..." />
        <Select
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="All Status"
          wrapperClassName="w-full sm:w-48"
        />
      </Card>

      <Table
        columns={columns}
        data={subscriptions}
        loading={loading}
        keyField={(row) => row._id}
        emptyMessage="No subscriptions found"
        pagination={{ currentPage: page, totalPages: pages, onPageChange: setPage }}
        rowClassName={(row) => {
          const health = subscriptionHealth(row);
          if (health === "expired") return "bg-red-50/70 hover:bg-red-50";
          if (health === "critical") return "bg-amber-50/60 hover:bg-amber-50";
          return "";
        }}
      />

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        title="Create Subscription"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Create Subscription
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Client"
            options={clientOptions}
            value={formData.clientId}
            onChange={(e) => {
              setFormData({ ...formData, clientId: e.target.value, projectId: "" });
              fetchProjectsForClient(e.target.value, setProjectOptions);
            }}
            required
          />
          <Select
            label="Project"
            options={projectOptions}
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            required
            disabled={!formData.clientId}
          />
          <Select
            label="Plan"
            options={planOptions}
            value={formData.planId}
            onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
            required
          />
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            label="Grace Period (days)"
            type="number"
            min={0}
            inputMode="numeric"
            value={formData.gracePeriodDays}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              setFormData({ ...formData, gracePeriodDays: digits ? parseInt(digits, 10) : 0 });
            }}
          />
        </div>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Subscription"
        description={editTarget ? editTarget.subscriptionId : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)} disabled={editSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} loading={editSubmitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Client"
            options={clientOptions}
            value={editForm.clientId}
            onChange={(e) => {
              setEditForm({ ...editForm, clientId: e.target.value, projectId: "" });
              fetchProjectsForClient(e.target.value, setEditProjectOptions);
            }}
            required
          />
          <Select
            label="Project"
            options={editProjectOptions}
            value={editForm.projectId}
            onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value })}
            required
            disabled={!editForm.clientId}
          />
          <Select
            label="Plan"
            options={planOptions}
            value={editForm.planId}
            onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
            required
          />
          <Input
            label="Start Date"
            type="date"
            value={editForm.startDate}
            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
          />
          <Input
            label="Grace Period (days)"
            type="number"
            min={0}
            inputMode="numeric"
            value={editForm.gracePeriodDays}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              setEditForm({ ...editForm, gracePeriodDays: digits ? parseInt(digits, 10) : 0 });
            }}
          />
          <Select
            label="Status"
            options={EDIT_STATUS_OPTIONS}
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
          />
          <Select
            label="Auto Renew"
            options={AUTO_RENEW_OPTIONS}
            value={editForm.autoRenew}
            onChange={(e) => setEditForm({ ...editForm, autoRenew: e.target.value })}
          />
          <Textarea
            label="Notes"
            className="sm:col-span-2"
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!renewTarget}
        onClose={() => setRenewTarget(null)}
        onConfirm={handleRenew}
        title="Renew Subscription"
        description={`Renew subscription ${renewTarget?.subscriptionId ?? ""} for another billing cycle?`}
        confirmLabel="Renew"
        variant="primary"
        loading={actionSubmitting}
      />

      <ConfirmDialog
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleSuspend}
        title="Suspend Subscription"
        description={`Suspend subscription ${suspendTarget?.subscriptionId ?? ""}? This immediately cuts off the client's access to the project until it is reactivated.`}
        confirmLabel="Suspend"
        variant="danger"
        loading={actionSubmitting}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Subscription"
        description={`Are you sure you want to delete subscription ${deleteTarget?.subscriptionId ?? ""}? This does not affect its payment history. This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
