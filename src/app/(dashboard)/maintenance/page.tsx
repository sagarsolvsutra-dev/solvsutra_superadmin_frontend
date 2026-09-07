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
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/Textarea";
import { RowActions, RegenerateAction, EditAction, DeleteAction } from "@/components/ui/RowActions";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { maintenanceService } from "@/services/maintenance.service";
import { maintenancePlanService } from "@/services/maintenancePlan.service";
import { clientService } from "@/services/client.service";
import { projectService } from "@/services/project.service";
import { getErrorMessage } from "@/lib/api";
import { formatDate, maintenanceHealth } from "@/lib/utils";
import type { MaintenanceSubscription, MaintenancePlan, Client, Project } from "@/types";

type SelectOption = { label: string; value: string };

type MaintenanceFormState = {
  clientId: string;
  projectId: string;
  maintenancePlanId: string;
  startDate: string;
};

const EMPTY_FORM: MaintenanceFormState = {
  clientId: "",
  projectId: "",
  maintenancePlanId: "",
  startDate: "",
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const EDIT_STATUS_OPTIONS = STATUS_FILTER_OPTIONS.filter((o) => o.value);
const AUTO_RENEW_OPTIONS = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

type MaintenanceEditForm = {
  autoRenew: string;
  status: string;
  notes: string;
};

const EMPTY_EDIT_FORM: MaintenanceEditForm = {
  autoRenew: "false",
  status: "active",
  notes: "",
};

function nameOf<T extends { _id: string }>(value: string | T | undefined, pick: (item: T) => string): string {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return pick(value) || "-";
}

function getDaysRemaining(expiryDate: string) {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** The stored `status` only flips to "expired" once the daily cron sweep
 * runs, so a maintenance subscription can be well past its expiry date while
 * it still reads "active" — show the live-computed truth instead, same as
 * the Subscriptions page does for hosting plans. */
function displayStatus(row: MaintenanceSubscription): string {
  if (maintenanceHealth(row) === "expired" && row.status !== "cancelled") return "expired";
  return row.status;
}

export default function MaintenancePage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<MaintenanceFormState>(EMPTY_FORM);

  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [maintenancePlanOptions, setMaintenancePlanOptions] = useState<{ label: string; value: string }[]>([]);
  const [projectOptions, setProjectOptions] = useState<SelectOption[]>([]);

  const [renewTarget, setRenewTarget] = useState<MaintenanceSubscription | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<MaintenanceSubscription | null>(null);
  const [editForm, setEditForm] = useState<MaintenanceEditForm>(EMPTY_EDIT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MaintenanceSubscription | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const {
    items: maintenanceSubscriptions,
    pages,
    loading,
    refetch,
  } = usePaginatedList(maintenanceService.list, {
    search,
    page,
    limit: 10,
    extraParams: { status: statusFilter || undefined },
  });

  useEffect(() => {
    Promise.all([clientService.list({ limit: 200 }), maintenancePlanService.list({ limit: 200, status: "active" })])
      .then(([clientsRes, plansRes]) => {
        setClientOptions(clientsRes.data.items.map((c: Client) => ({ value: c._id, label: c.companyName })));
        setMaintenancePlanOptions(
          plansRes.data.items.map((p: MaintenancePlan) => ({
            value: p._id,
            label: `${p.name} — ${p.isFree ? "Free" : `₹${p.price}`}/${p.durationUnit}`,
          }))
        );
      })
      .catch((err) => toast.error(getErrorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjectsForClient = async (clientId: string) => {
    if (!clientId) {
      setProjectOptions([]);
      return;
    }
    try {
      const res = await projectService.list({ clientId, limit: 200 });
      setProjectOptions(res.data.items.map((p: Project) => ({ value: p._id, label: p.projectName })));
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
    if (!formData.clientId || !formData.projectId || !formData.maintenancePlanId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await maintenanceService.create(formData);
      toast.success("Maintenance plan assigned to project");
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
      await maintenanceService.renew(renewTarget._id);
      toast.success("Maintenance plan renewed");
      setRenewTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionSubmitting(false);
    }
  };

  const openEdit = (row: MaintenanceSubscription) => {
    setEditTarget(row);
    setEditForm({
      autoRenew: String(row.autoRenew),
      status: row.status,
      notes: row.notes || "",
    });
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;
    setEditSubmitting(true);
    try {
      await maintenanceService.update(editTarget._id, {
        autoRenew: editForm.autoRenew === "true",
        status: editForm.status,
        notes: editForm.notes,
      });
      toast.success("Maintenance subscription updated");
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
      await maintenanceService.remove(deleteTarget._id);
      toast.success("Maintenance subscription deleted");
      setDeleteTarget(null);
      if (maintenanceSubscriptions.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refetch();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<MaintenanceSubscription>[] = [
    { header: "ID", render: (row) => <span className="font-mono text-xs">{row.maintenanceSubscriptionId}</span> },
    { header: "Client", primary: true, render: (row) => nameOf<Client>(row.clientId, (c) => c.companyName) },
    { header: "Project", render: (row) => nameOf<Project>(row.projectId, (p) => p.projectName) },
    {
      header: "Plan",
      render: (row) => {
        const plan = typeof row.maintenancePlanId === "object" ? row.maintenancePlanId : null;
        return plan ? (
          <span>
            {plan.name} {plan.isFree && <span className="text-xs text-emerald-600">(Free)</span>}
          </span>
        ) : (
          "-"
        );
      },
    },
    {
      header: "Expiry",
      render: (row) => {
        const days = getDaysRemaining(row.expiryDate);
        return (
          <div>
            <div>{formatDate(row.expiryDate)}</div>
            <div className={`text-xs ${days <= 7 ? "font-medium text-red-500" : days <= 30 ? "text-amber-500" : "text-slate-500"}`}>
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
          <EditAction onClick={() => openEdit(row)} />
          <DeleteAction onClick={() => setDeleteTarget(row)} />
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Track which projects have a maintenance plan assigned"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
              <FiRefreshCw className="h-4 w-4" />
            </Button>
            <Button icon={<FiPlus className="h-4 w-4" />} onClick={() => setIsDialogOpen(true)}>
              Assign Maintenance Plan
            </Button>
          </div>
        }
      />

      <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search maintenance subscriptions..." />
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
        data={maintenanceSubscriptions}
        loading={loading}
        keyField={(row) => row._id}
        emptyMessage="No maintenance plans assigned yet"
        pagination={{ currentPage: page, totalPages: pages, onPageChange: setPage }}
        rowClassName={(row) => {
          const health = maintenanceHealth(row);
          if (health === "expired") return "bg-red-50/70 hover:bg-red-50";
          if (health === "critical") return "bg-amber-50/60 hover:bg-amber-50";
          return "";
        }}
      />

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        title="Assign Maintenance Plan"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              Assign Plan
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
              fetchProjectsForClient(e.target.value);
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
            label="Maintenance Plan"
            options={maintenancePlanOptions}
            value={formData.maintenancePlanId}
            onChange={(e) => setFormData({ ...formData, maintenancePlanId: e.target.value })}
            required
            wrapperClassName="sm:col-span-2"
          />
          <DatePicker
            label="Start Date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Maintenance Subscription"
        description={editTarget ? editTarget.maintenanceSubscriptionId : undefined}
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
        <div className="space-y-4">
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
          <Textarea label="Notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!renewTarget}
        onClose={() => setRenewTarget(null)}
        onConfirm={handleRenew}
        title="Renew Maintenance Plan"
        description={`Renew maintenance subscription ${renewTarget?.maintenanceSubscriptionId ?? ""} for another billing cycle?`}
        confirmLabel="Renew"
        variant="primary"
        loading={actionSubmitting}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Maintenance Subscription"
        description={`Are you sure you want to delete maintenance subscription ${deleteTarget?.maintenanceSubscriptionId ?? ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
