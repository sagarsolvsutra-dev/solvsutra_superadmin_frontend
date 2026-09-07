"use client";

import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiEye, FiCalendar, FiCreditCard, FiAlertCircle, FiTool, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { RowActions, ViewAction, EditAction, DeleteAction, RegenerateAction } from "@/components/ui/RowActions";
import { FiUsers } from "react-icons/fi";
import { ProjectTeamDialog } from "@/components/projects/ProjectTeamDialog";
import { CopyButton } from "@/components/ui/CopyButton";
import { projectTeamService, type StaffSummary } from "@/services";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { getErrorMessage } from "@/lib/api";
import { clientService } from "@/services/client.service";
import { projectService } from "@/services/project.service";
import { subscriptionService } from "@/services/subscription.service";
import { maintenanceService } from "@/services/maintenance.service";
import { maintenancePlanService } from "@/services/maintenancePlan.service";
import { cn, daysUntil, formatCurrency, formatDate, subscriptionHealth } from "@/lib/utils";
import type { Client, MaintenancePlan, Plan, Project, ProjectMaintenanceStatus, Subscription } from "@/types";

const statusFilterOptions = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const environmentOptions = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
];

const emptyForm = {
  clientId: "",
  projectName: "",
  description: "",
  frontendUrl: "",
  adminUrl: "",
  backendUrl: "",
  repositoryUrl: "",
  environment: "production",
  techStack: "",
  domain: "",
  status: "active",
};

type ProjectForm = typeof emptyForm;

const clientName = (clientId: Project["clientId"]) => (typeof clientId === "object" && clientId ? clientId.companyName : "-");
const clientIdValue = (clientId: Project["clientId"]) => (typeof clientId === "object" && clientId ? clientId._id : (clientId as string) || "");

// Prefer a non-cancelled subscription over a cancelled one, then the more
// recently started of two equally-ranked candidates. Shared by the
// subscription-health map (table) and the "View details" dialog so the two
// views can never disagree about which subscription is "the" one for a
// project.
const subscriptionRank = (sub: Subscription) => (sub.status === "cancelled" ? 0 : 1);
function preferSubscription(a: Subscription, b: Subscription): Subscription {
  const rankA = subscriptionRank(a);
  const rankB = subscriptionRank(b);
  if (rankB > rankA) return b;
  if (rankB === rankA && new Date(b.startDate) > new Date(a.startDate)) return b;
  return a;
}

// A flat fetch with no pagination fallback silently truncates past this many
// rows — this is a cheap "there might be more" signal, not a hard cap.
const DROPDOWN_FETCH_LIMIT = 200;

export default function ProjectsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const { items, pages, loading, refetch } = usePaginatedList<Project>(projectService.list, {
    search,
    page,
    limit: 10,
    extraParams: { status: statusFilter || undefined },
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsTruncated, setClientsTruncated] = useState(false);
  useEffect(() => {
    clientService
      .list({ limit: DROPDOWN_FETCH_LIMIT })
      .then((res) => {
        setClients(res.data.items);
        const hitLimit = res.data.items.length === DROPDOWN_FETCH_LIMIT;
        setClientsTruncated(hitLimit);
        if (hitLimit) {
          console.warn(
            `[ProjectsPage] client dropdown fetch returned exactly ${DROPDOWN_FETCH_LIMIT} rows — there may be more clients that are not shown.`
          );
        }
      })
      .catch(() => { });
  }, []);
  const clientOptions = clients.map((c) => ({ label: c.companyName, value: c._id }));

  // One subscription per project, chosen so the row can show the client's real
  // billing health at a glance (not just the project's own status field, which
  // has nothing to do with whether their plan has lapsed).
  const [subscriptionsByProject, setSubscriptionsByProject] = useState<Record<string, Subscription>>({});
  useEffect(() => {
    subscriptionService
      .list({ limit: DROPDOWN_FETCH_LIMIT })
      .then((res) => {
        if (res.data.items.length === DROPDOWN_FETCH_LIMIT) {
          console.warn(
            `[ProjectsPage] subscription-health fetch returned exactly ${DROPDOWN_FETCH_LIMIT} rows — there may be more subscriptions that are not reflected in the table's health indicator.`
          );
        }
        const map: Record<string, Subscription> = {};
        for (const sub of res.data.items) {
          const pid = typeof sub.projectId === "object" ? sub.projectId._id : sub.projectId;
          if (!pid) continue;
          const existing = map[pid];
          map[pid] = existing ? preferSubscription(existing, sub) : sub;
        }
        setSubscriptionsByProject(map);
      })
      .catch(() => { });
  }, []);

  const projectSubscriptionHealth = (projectId: string): "expired" | "critical" | null => {
    const sub = subscriptionsByProject[projectId];
    return sub ? subscriptionHealth(sub) : null;
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [projectSubscription, setProjectSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const [regenerateTarget, setRegenerateTarget] = useState<Project | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const [maintenanceStatus, setMaintenanceStatus] = useState<ProjectMaintenanceStatus | null>(null);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([]);
  const [isSellMaintenanceOpen, setIsSellMaintenanceOpen] = useState(false);
  const [sellForm, setSellForm] = useState({ maintenancePlanId: "", startDate: new Date().toISOString().slice(0, 10) });
  const [sellingMaintenance, setSellingMaintenance] = useState(false);

  const openCreate = () => {
    setSelectedProject(null);
    setFormData(emptyForm);
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      clientId: clientIdValue(project.clientId),
      projectName: project.projectName,
      description: project.description || "",
      frontendUrl: project.frontendUrl || "",
      adminUrl: project.adminUrl || "",
      backendUrl: project.backendUrl || "",
      repositoryUrl: project.repositoryUrl || "",
      environment: project.environment,
      techStack: project.techStack || "",
      domain: project.domain || "",
      status: project.status,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clientId) newErrors.clientId = "Client is required";
    if (!formData.projectName.trim()) newErrors.projectName = "Project name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }
    setSubmitting(true);
    try {
      if (selectedProject) {
        await projectService.update(selectedProject._id, formData);
        toast.success("Project updated successfully");
      } else {
        await projectService.create(formData);
        toast.success("Project created successfully");
      }
      setIsDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectService.remove(deleteTarget._id);
      toast.success("Project deleted successfully");
      setDeleteTarget(null);
      if (items.length === 1 && page > 1) {
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

  const openDetails = async (project: Project) => {
    setDetailsProject(project);
    setIsDetailsOpen(true);
    setProjectSubscription(null);
    setLoadingSubscription(true);
    try {
      // Fetch every subscription for this project and rank with the same
      // comparator the table uses, so this panel can never disagree with the
      // health indicator shown in the row the user clicked "View details" from.
      const res = await subscriptionService.list({ projectId: project._id, limit: DROPDOWN_FETCH_LIMIT });
      const items = res.data.items;
      setProjectSubscription(items.length ? items.reduce(preferSubscription) : null);
    } catch {
      // No subscription yet for this project — leave the panel showing the empty state.
    } finally {
      setLoadingSubscription(false);
    }
    loadMaintenanceStatus(project._id);
  };

  const loadMaintenanceStatus = async (projectId: string) => {
    setMaintenanceStatus(null);
    setLoadingMaintenance(true);
    try {
      const res = await maintenanceService.projectStatus(projectId);
      setMaintenanceStatus(res.data);
    } catch {
      // Leave it null — the card shows nothing rather than a stale state.
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!detailsProject || !maintenanceStatus) return;
    setTogglingMaintenance(true);
    try {
      const res = await maintenanceService.toggleProjectMaintenance(detailsProject._id, !maintenanceStatus.maintenanceRequired);
      setMaintenanceStatus(res.data);
      toast.success(res.data.maintenanceRequired ? "Maintenance prompt turned on for this project" : "Maintenance prompt turned off");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const openSellMaintenance = () => {
    setSellForm({ maintenancePlanId: "", startDate: new Date().toISOString().slice(0, 10) });
    setIsSellMaintenanceOpen(true);
    if (maintenancePlans.length === 0) {
      maintenancePlanService
        .list({ limit: 50, status: "active" })
        .then((res) => setMaintenancePlans(res.data.items))
        .catch(() => {});
    }
  };

  const handleSellMaintenance = async () => {
    if (!detailsProject) return;
    if (!sellForm.maintenancePlanId) {
      toast.error("Select a maintenance plan");
      return;
    }
    const clientIdVal = clientIdValue(detailsProject.clientId);
    setSellingMaintenance(true);
    try {
      await maintenanceService.create({
        clientId: clientIdVal,
        projectId: detailsProject._id,
        maintenancePlanId: sellForm.maintenancePlanId,
        startDate: sellForm.startDate,
      });
      toast.success("Maintenance plan recorded for this project");
      setIsSellMaintenanceOpen(false);
      loadMaintenanceStatus(detailsProject._id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSellingMaintenance(false);
    }
  };

  const handleRegenerateCredentials = async () => {
    if (!regenerateTarget) return;
    setRegenerating(true);
    try {
      await projectService.regenerateCredentials(regenerateTarget._id);
      toast.success("New API credentials generated. The previous key has been invalidated.", "Credentials regenerated");
      setRegenerateTarget(null);
      refetch();
      if (detailsProject?._id === regenerateTarget._id) {
        const res = await projectService.get(regenerateTarget._id);
        setDetailsProject(res.data.project ?? res.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRegenerating(false);
    }
  };

  const [teamTarget, setTeamTarget] = useState<Project | null>(null);
  const [staffSummary, setStaffSummary] = useState<StaffSummary>({});

  const loadStaffSummary = useCallback(() => {
    projectTeamService
      .staffSummary()
      .then(setStaffSummary)
      .catch(() => setStaffSummary({}));
  }, []);

  useEffect(() => {
    loadStaffSummary();
  }, [loadStaffSummary]);

  const columns: Column<Project>[] = [
    {
      header: "Project ID",
      render: (row) => <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{row.projectId}</span>,
    },
    { header: "Project Name", primary: true, render: (row) => <span className="font-medium">{row.projectName}</span> },
    { header: "Client", render: (row) => clientName(row.clientId) },
    {
      header: "Environment",
      render: (row) => (
        <Badge tone={row.environment === "production" ? "info" : row.environment === "staging" ? "warning" : "neutral"}>
          {row.environment}
        </Badge>
      ),
    },
    { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Subscription",
      render: (row) => {
        const sub = subscriptionsByProject[row._id];
        if (!sub) return <span className="text-xs text-slate-400">No subscription</span>;
        const days = daysUntil(sub.expiryDate);
        return (
          <div className="flex flex-col gap-0.5">
            <StatusBadge status={sub.status} />
            <span className={cn("text-xs", days < 0 ? "font-medium text-red-500" : days <= 7 ? "font-medium text-amber-500" : "text-slate-400")}>
              {days < 0 ? `Expired ${Math.abs(days)}d ago` : days === 0 ? "Expires today" : `${days}d left`}
            </span>
          </div>
        );
      },
    },
    {
      header: "Frontend",
      render: (row) =>
        row.frontendUrl ? (
          <a href={row.frontendUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">
            Link
          </a>
        ) : (
          "-"
        ),
    },
    {
      header: "Staff",
      align: "center",
      render: (row) => {
        const count = staffSummary[row._id]?.staffCount ?? 0;
        return (
          <button
            onClick={() => setTeamTarget(row)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-slate-100"
            title="Manage team & timeline"
          >
            <FiUsers className="h-3.5 w-3.5 text-slate-400" />
            <span className={count ? "text-slate-900" : "text-slate-400"}>{count}</span>
          </button>
        );
      },
    },
    { header: "Created", render: (row) => formatDate(row.createdAt) },
    {
      header: "Actions",
      align: "center",
      render: (row) => (
        <RowActions>
          <ViewAction title="View details" onClick={() => openDetails(row)} />
          <button
            onClick={() => setTeamTarget(row)}
            title="Team & timeline"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <FiUsers className="h-4 w-4" />
          </button>
          <EditAction onClick={() => openEdit(row)} />
          <RegenerateAction title="Regenerate credentials" onClick={() => setRegenerateTarget(row)} />
          <DeleteAction onClick={() => setDeleteTarget(row)} />
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage client projects"
        actions={
          <Button icon={<FiPlus className="h-4 w-4" />} onClick={openCreate}>
            Add Project
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search projects..."
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          wrapperClassName="w-full sm:w-44"
        />
      </div>

      <Table
        columns={columns}
        data={items}
        keyField={(row) => row._id}
        loading={loading}
        emptyMessage="No projects found"
        pagination={{ currentPage: page, totalPages: pages, onPageChange: setPage }}
        rowClassName={(row) => {
          const health = projectSubscriptionHealth(row._id);
          if (health === "expired") return "bg-red-50/70 hover:bg-red-50";
          if (health === "critical") return "bg-amber-50/60 hover:bg-amber-50";
          return "";
        }}
      />

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedProject ? "Edit Project" : "Add Project"}
        size="lg"
        preventCloseWhileBusy={submitting}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {selectedProject ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Client"
            required
            error={errors.clientId}
            hint={clientsTruncated ? `Showing first ${DROPDOWN_FETCH_LIMIT} clients — search isn't available here yet.` : undefined}
            placeholder="Select client"
            options={clientOptions}
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            wrapperClassName="sm:col-span-2"
          />
          <Input
            label="Project Name"
            required
            error={errors.projectName}
            wrapperClassName="sm:col-span-2"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          />
          <Textarea
            label="Description"
            className="sm:col-span-2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label="Frontend URL"
            value={formData.frontendUrl}
            onChange={(e) => setFormData({ ...formData, frontendUrl: e.target.value })}
          />
          <Input
            label="Admin URL"
            value={formData.adminUrl}
            onChange={(e) => setFormData({ ...formData, adminUrl: e.target.value })}
          />
          <Input
            label="Backend URL"
            value={formData.backendUrl}
            onChange={(e) => setFormData({ ...formData, backendUrl: e.target.value })}
          />
          <Input
            label="Repository URL"
            value={formData.repositoryUrl}
            onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
          />
          <Input
            label="Tech Stack"
            value={formData.techStack}
            onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
          />
          <Input label="Domain" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
          <Select
            label="Environment"
            options={environmentOptions}
            value={formData.environment}
            onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />
        </form>
      </Dialog>

      {/* Project Details — info, credentials, plan/subscription, URLs */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={detailsProject ? `${detailsProject.projectName} — Details` : "Project Details"}
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
            Close
          </Button>
        }
      >
        {detailsProject && (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FiEye size={16} /> Project Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Project Name:</span>
                  <p className="font-medium">{detailsProject.projectName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Project ID:</span>
                  <div className="flex items-center gap-1">
                    <p className="font-mono text-xs">{detailsProject.projectId}</p>
                    <CopyButton value={detailsProject.projectId} label="Copy Project ID" />
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Client:</span>
                  <p className="font-medium">{clientName(detailsProject.clientId)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Environment:</span>
                  <p>
                    <Badge tone={detailsProject.environment === "production" ? "info" : "neutral"}>
                      {detailsProject.environment}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <p>
                    <StatusBadge status={detailsProject.status} />
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Created:</span>
                  <p className="font-medium">{formatDate(detailsProject.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">API Credentials</h3>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<FiAlertCircle className="h-3.5 w-3.5" />}
                  onClick={() => setRegenerateTarget(detailsProject)}
                >
                  Regenerate
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-500">API Key:</span>
                  <div className="mt-1 flex items-start gap-2 rounded bg-white px-3 py-2">
                    <p className="min-w-0 flex-1 break-all font-mono text-xs">
                      {detailsProject.apiKey || "Regenerate to get credentials"}
                    </p>
                    <CopyButton value={detailsProject.apiKey} label="Copy API key" />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Regenerating invalidates the existing API key immediately.</p>
            </div>

            <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FiCreditCard size={16} className="text-brand-600" /> Current Plan &amp; Subscription
              </h3>

              {loadingSubscription ? (
                <div className="space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                </div>
              ) : !projectSubscription ? (
                <div className="py-4 text-center">
                  <FiAlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                  <p className="text-sm text-slate-600">No active subscription found</p>
                  <p className="mt-1 text-xs text-slate-500">Create a subscription from the Subscriptions page</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Plan</span>
                      <p className="text-lg font-bold text-slate-900">
                        {typeof projectSubscription.planId === "object" ? (projectSubscription.planId as Plan).name : "Plan"}
                      </p>
                    </div>
                    <StatusBadge status={projectSubscription.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-3">
                    <div className="flex items-start gap-2">
                      <FiCalendar size={14} className="mt-0.5 text-slate-400" />
                      <div>
                        <span className="block text-xs text-slate-500">Start Date</span>
                        <p className="text-sm font-medium">{formatDate(projectSubscription.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiCalendar size={14} className="mt-0.5 text-slate-400" />
                      <div>
                        <span className="block text-xs text-slate-500">Expiry Date</span>
                        <p className="text-sm font-medium">{formatDate(projectSubscription.expiryDate)}</p>
                        <p className="text-xs text-slate-500">
                          {(() => {
                            const days = daysUntil(projectSubscription.expiryDate);
                            if (days < 0) return <span className="font-medium text-red-500">Expired {Math.abs(days)} days ago</span>;
                            if (days === 0) return <span className="font-medium text-amber-500">Expires today</span>;
                            return <span className="font-medium text-emerald-600">{days} days left</span>;
                          })()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Price</span>
                      <p className="text-sm font-medium">
                        {typeof projectSubscription.planId === "object"
                          ? `${formatCurrency((projectSubscription.planId as Plan).price)} / ${(projectSubscription.planId as Plan).durationUnit}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Renewals</span>
                      <p className="text-sm font-medium">{projectSubscription.renewalCount || 0} times</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-brand-200 pt-3">
                    <div>
                      <span className="block text-xs text-slate-500">Subscription ID</span>
                      <p className="font-mono text-xs">{projectSubscription.subscriptionId}</p>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Grace Period</span>
                      <p className="text-sm font-medium">{projectSubscription.gracePeriodDays || 0} days</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FiTool size={16} className="text-slate-500" /> Maintenance
              </h3>

              {loadingMaintenance ? (
                <div className="space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                </div>
              ) : !maintenanceStatus ? (
                <p className="text-sm text-slate-500">Could not load maintenance status.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Show the &ldquo;maintenance plan required&rdquo; prompt to this client
                    </p>
                    <button
                      onClick={handleToggleMaintenance}
                      disabled={togglingMaintenance}
                      title="Show/hide the 'maintenance plan required' prompt for this project"
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      {maintenanceStatus.maintenanceRequired ? (
                        <FiToggleRight className="h-5 w-5 text-brand-600" />
                      ) : (
                        <FiToggleLeft className="h-5 w-5 text-slate-400" />
                      )}
                      Show prompt
                    </button>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    {maintenanceStatus.activeMaintenanceSubscription ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {maintenanceStatus.activeMaintenanceSubscription.maintenancePlanId.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Active until {formatDate(maintenanceStatus.activeMaintenanceSubscription.expiryDate)}
                          </p>
                        </div>
                        <StatusBadge status={maintenanceStatus.activeMaintenanceSubscription.status} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">No maintenance plan purchased yet</p>
                        <Button size="sm" variant="outline" onClick={openSellMaintenance}>
                          Assign Maintenance Plan
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(detailsProject.frontendUrl || detailsProject.adminUrl || detailsProject.backendUrl) && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">URLs</h3>
                <div className="space-y-2 text-sm">
                  {detailsProject.frontendUrl && (
                    <div>
                      <span className="text-slate-500">Frontend:</span>{" "}
                      <a href={detailsProject.frontendUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                        {detailsProject.frontendUrl}
                      </a>
                    </div>
                  )}
                  {detailsProject.adminUrl && (
                    <div>
                      <span className="text-slate-500">Admin:</span>{" "}
                      <a href={detailsProject.adminUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                        {detailsProject.adminUrl}
                      </a>
                    </div>
                  )}
                  {detailsProject.backendUrl && (
                    <div>
                      <span className="text-slate-500">Backend:</span>{" "}
                      <a href={detailsProject.backendUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                        {detailsProject.backendUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteTarget?.projectName}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={Boolean(regenerateTarget)}
        onClose={() => setRegenerateTarget(null)}
        onConfirm={handleRegenerateCredentials}
        loading={regenerating}
        title="Regenerate API Credentials"
        description={`This will generate a new API key for "${regenerateTarget?.projectName}". The existing key will stop working immediately. This action cannot be undone.`}
        confirmLabel="Regenerate"
      />
      <Dialog
        open={isSellMaintenanceOpen}
        onClose={() => setIsSellMaintenanceOpen(false)}
        title="Assign Maintenance Plan"
        preventCloseWhileBusy={sellingMaintenance}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSellMaintenanceOpen(false)} disabled={sellingMaintenance}>
              Cancel
            </Button>
            <Button onClick={handleSellMaintenance} loading={sellingMaintenance}>
              Assign Plan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Maintenance Plan"
            required
            placeholder="Select a maintenance plan"
            options={maintenancePlans.map((p) => ({
              label: `${p.name} — ${p.isFree ? "Free" : formatCurrency(p.price)}/${p.durationUnit}`,
              value: p._id,
            }))}
            value={sellForm.maintenancePlanId}
            onChange={(e) => setSellForm({ ...sellForm, maintenancePlanId: e.target.value })}
          />
          <DatePicker
            label="Start Date"
            value={sellForm.startDate}
            onChange={(e) => setSellForm({ ...sellForm, startDate: e.target.value })}
          />
        </div>
      </Dialog>

      <ProjectTeamDialog
        open={!!teamTarget}
        onClose={() => setTeamTarget(null)}
        projectId={teamTarget?._id ?? null}
        projectName={teamTarget?.projectName}
        onChanged={loadStaffSummary}
      />

    </div>
  );
}
