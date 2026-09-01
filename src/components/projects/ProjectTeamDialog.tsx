"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiUsers,
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheckCircle,
  FiClock,
  FiAlertOctagon,
  FiLoader,
} from "react-icons/fi";
import { Dialog, Button, Input, Select, Textarea, Badge, useToast, ConfirmDialog } from "@/components/ui";
import { getErrorMessage } from "@/lib/api";
import {
  projectTeamService,
  ASSIGNMENT_ROLE_LABELS,
  MILESTONE_STATUS_LABELS,
  type ProjectAssignment,
  type ProjectMilestone,
  type MilestoneStatus,
} from "@/services";
import { userService } from "@/services";

type Tab = "staff" | "timeline";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName?: string;
  /** Called after any change, so the parent list can refresh its staff counts. */
  onChanged?: () => void;
}

const ROLE_OPTIONS = Object.entries(ASSIGNMENT_ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_OPTIONS = Object.entries(MILESTONE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_TONE: Record<MilestoneStatus, "success" | "info" | "warning" | "danger"> = {
  completed: "success",
  in_progress: "info",
  planned: "warning",
  blocked: "danger",
};

const STATUS_ICON: Record<MilestoneStatus, React.ReactNode> = {
  completed: <FiCheckCircle className="h-4 w-4" />,
  in_progress: <FiLoader className="h-4 w-4" />,
  planned: <FiClock className="h-4 w-4" />,
  blocked: <FiAlertOctagon className="h-4 w-4" />,
};

const toDateInput = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

export function ProjectTeamDialog({ open, onClose, projectId, projectName, onChanged }: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("staff");

  const [staff, setStaff] = useState<ProjectAssignment[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [progress, setProgress] = useState(0);
  const [users, setUsers] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // staff form
  const [staffForm, setStaffForm] = useState({
    userId: "",
    role: "developer",
    allocationPercent: "100",
    notes: "",
  });
  const [editingAssignment, setEditingAssignment] = useState<ProjectAssignment | null>(null);

  // milestone form
  const [msForm, setMsForm] = useState({
    title: "",
    description: "",
    date: toDateInput(new Date().toISOString()),
    status: "planned" as MilestoneStatus,
  });
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);

  const [confirm, setConfirm] = useState<{ kind: Tab; id: string; label: string } | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [staffRes, msRes] = await Promise.all([
        projectTeamService.listStaff(projectId),
        projectTeamService.listMilestones(projectId),
      ]);
      setStaff(staffRes.assignments || []);
      setMilestones(msRes.milestones || []);
      setProgress(msRes.progress || 0);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    if (!open || !projectId) return;
    load();
    // NOTE: userService.list returns the raw axios response (it does not go
    // through normalizeList like the other services), so the array lives at
    // res.data.users — not res.items.
    userService
      .list({ limit: 100 })
      .then((res: any) => {
        const list = res?.data?.users ?? res?.data?.items ?? [];
        setUsers(list);
        if (list.length === 0) {
          toast.error("No staff accounts found — add users on the Users page first");
        }
      })
      .catch((err) => {
        setUsers([]);
        toast.error(getErrorMessage(err));
      });
  }, [open, projectId, load, toast]);

  // People not already on the project can be added; the one being edited stays selectable.
  const availableUsers = useMemo(() => {
    const taken = new Set(staff.filter((a) => a.isActive).map((a) => a.userId?._id));
    if (editingAssignment?.userId?._id) taken.delete(editingAssignment.userId._id);
    return users.filter((u) => !taken.has(u._id));
  }, [users, staff, editingAssignment]);

  const totalAllocation = staff
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + (a.allocationPercent || 0), 0);

  const resetStaffForm = () => {
    setEditingAssignment(null);
    setStaffForm({ userId: "", role: "developer", allocationPercent: "100", notes: "" });
  };

  const resetMsForm = () => {
    setEditingMilestone(null);
    setMsForm({
      title: "",
      description: "",
      date: toDateInput(new Date().toISOString()),
      status: "planned",
    });
  };

  const submitStaff = async () => {
    if (!projectId) return;
    if (!editingAssignment && !staffForm.userId) {
      toast.error("Select a staff member");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        userId: editingAssignment?.userId?._id || staffForm.userId,
        role: staffForm.role,
        allocationPercent: Number(staffForm.allocationPercent) || 0,
        notes: staffForm.notes,
      };
      if (editingAssignment) {
        await projectTeamService.updateAssignment(projectId, editingAssignment._id, payload);
        toast.success("Assignment updated");
      } else {
        await projectTeamService.assignStaff(projectId, payload);
        toast.success("Staff assigned");
      }
      resetStaffForm();
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitMilestone = async () => {
    if (!projectId) return;
    if (!msForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (editingMilestone) {
        await projectTeamService.updateMilestone(projectId, editingMilestone._id, msForm);
        toast.success("Milestone updated");
      } else {
        await projectTeamService.createMilestone(projectId, msForm);
        toast.success("Milestone added");
      }
      resetMsForm();
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!projectId || !confirm) return;
    try {
      if (confirm.kind === "staff") {
        await projectTeamService.removeAssignment(projectId, confirm.id);
        toast.success("Removed from project");
      } else {
        await projectTeamService.deleteMilestone(projectId, confirm.id);
        toast.success("Milestone deleted");
      }
      setConfirm(null);
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={projectName ? `${projectName} — Team & Timeline` : "Team & Timeline"}
        description="Who is working on this project, and how it is progressing."
        size="xl"
      >
        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-slate-100">
          {(["staff", "timeline"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === t
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "staff" ? <FiUsers className="h-4 w-4" /> : <FiCalendar className="h-4 w-4" />}
              {t === "staff" ? `Staff (${staff.filter((s) => s.isActive).length})` : `Timeline (${milestones.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : tab === "staff" ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Assigned</p>
                <p className="text-lg font-bold text-slate-900">
                  {staff.filter((s) => s.isActive).length}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total allocation</p>
                <p
                  className={`text-lg font-bold ${
                    totalAllocation > 100 * staff.filter((s) => s.isActive).length
                      ? "text-amber-600"
                      : "text-slate-900"
                  }`}
                >
                  {totalAllocation}%
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Roles covered</p>
                <p className="text-lg font-bold text-slate-900">
                  {new Set(staff.filter((s) => s.isActive).map((s) => s.role)).size}
                </p>
              </div>
            </div>

            {/* Add / edit */}
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">
                {editingAssignment
                  ? `Edit — ${editingAssignment.userId?.name}`
                  : "Assign a staff member"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {!editingAssignment && (
                  <Select
                    label="Staff"
                    value={staffForm.userId}
                    onChange={(e) => setStaffForm({ ...staffForm, userId: e.target.value })}
                    options={availableUsers.map((u) => ({
                      value: u._id,
                      label: `${u.name} (${u.email})`,
                    }))}
                    placeholder="Select staff…"
                  />
                )}
                <Select
                  label="Role on this project"
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  options={ROLE_OPTIONS}
                />
                <Input
                  label="Allocation %"
                  type="number"
                  min={0}
                  max={100}
                  value={staffForm.allocationPercent}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, allocationPercent: e.target.value })
                  }
                />
                <Input
                  label="Notes"
                  value={staffForm.notes}
                  onChange={(e) => setStaffForm({ ...staffForm, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={submitStaff} disabled={saving}>
                  <FiPlus className="mr-1.5 h-4 w-4" />
                  {editingAssignment ? "Save changes" : "Assign"}
                </Button>
                {editingAssignment && (
                  <Button variant="secondary" onClick={resetStaffForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2">
              {staff.filter((s) => s.isActive).length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  Nobody is assigned to this project yet.
                </p>
              )}
              {staff
                .filter((s) => s.isActive)
                .map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-slate-900">
                          {a.userId?.name || "Unknown user"}
                        </p>
                        <Badge tone="info">{ASSIGNMENT_ROLE_LABELS[a.role]}</Badge>
                        <Badge tone="neutral">{a.allocationPercent}%</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {a.userId?.email} · since {fmtDate(a.startDate)}
                        {a.notes ? ` · ${a.notes}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => {
                          setEditingAssignment(a);
                          setStaffForm({
                            userId: a.userId?._id || "",
                            role: a.role,
                            allocationPercent: String(a.allocationPercent),
                            notes: a.notes || "",
                          });
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Edit"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirm({
                            kind: "staff",
                            id: a._id,
                            label: a.userId?.name || "this person",
                          })
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Remove"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Progress</span>
                <span className="font-bold text-slate-900">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Add / edit */}
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">
                {editingMilestone ? "Edit milestone" : "Add a milestone"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Title"
                  value={msForm.title}
                  onChange={(e) => setMsForm({ ...msForm, title: e.target.value })}
                  placeholder="e.g. Design approved"
                  required
                />
                <Input
                  label="Date"
                  type="date"
                  value={msForm.date}
                  onChange={(e) => setMsForm({ ...msForm, date: e.target.value })}
                />
                <Select
                  label="Status"
                  value={msForm.status}
                  onChange={(e) => setMsForm({ ...msForm, status: e.target.value as MilestoneStatus })}
                  options={STATUS_OPTIONS}
                />
                <div className="sm:col-span-2">
                  <Textarea
                    label="Description"
                    value={msForm.description}
                    onChange={(e) => setMsForm({ ...msForm, description: e.target.value })}
                    rows={2}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={submitMilestone} disabled={saving}>
                  <FiPlus className="mr-1.5 h-4 w-4" />
                  {editingMilestone ? "Save changes" : "Add milestone"}
                </Button>
                {editingMilestone && (
                  <Button variant="secondary" onClick={resetMsForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* Timeline */}
            {milestones.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No milestones yet — add the first one above.
              </p>
            ) : (
              <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
                {milestones.map((m) => (
                  <li key={m._id} className="relative">
                    <span
                      className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${
                        m.status === "completed"
                          ? "bg-emerald-500 text-white"
                          : m.status === "blocked"
                          ? "bg-red-500 text-white"
                          : m.status === "in_progress"
                          ? "bg-sky-500 text-white"
                          : "bg-slate-300 text-slate-700"
                      }`}
                    >
                      <span className="scale-[0.6]">{STATUS_ICON[m.status]}</span>
                    </span>
                    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">{m.title}</p>
                          <Badge tone={STATUS_TONE[m.status]}>
                            {MILESTONE_STATUS_LABELS[m.status]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">{fmtDate(m.date)}</p>
                        {m.description && (
                          <p className="mt-1 text-sm text-slate-600">{m.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => {
                            setEditingMilestone(m);
                            setMsForm({
                              title: m.title,
                              description: m.description || "",
                              date: toDateInput(m.date),
                              status: m.status,
                            });
                          }}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirm({ kind: "timeline", id: m._id, label: m.title })}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        title={confirm?.kind === "staff" ? "Remove from project" : "Delete milestone"}
        description={
          confirm?.kind === "staff"
            ? `Remove ${confirm?.label} from this project? Their past assignment is kept as history.`
            : `Delete "${confirm?.label}"? This cannot be undone.`
        }
        confirmLabel={confirm?.kind === "staff" ? "Remove" : "Delete"}
      />
    </>
  );
}

export default ProjectTeamDialog;
