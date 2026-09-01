"use client";

import { useEffect, useState } from "react";
import { FiLock, FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, Column } from "@/components/ui/Table";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { RowActions, EditAction, DeleteAction } from "@/components/ui/RowActions";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { domainService } from "@/services/domain.service";
import { projectService } from "@/services/project.service";
import { getErrorMessage } from "@/lib/api";
import type { Domain, Project } from "@/types";

type DomainFormData = {
  domain: string;
  projectId: string;
  type: Domain["type"];
  sslEnabled: boolean;
  provider: string;
  dnsProvider: string;
  nameserversInput: string;
  notes: string;
  status: Domain["status"];
};

const TYPE_OPTIONS = [
  { value: "main", label: "Main" },
  { value: "subdomain", label: "Subdomain" },
  { value: "redirect", label: "Redirect" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "suspended", label: "Suspended" },
];

const SSL_OPTIONS = [
  { value: "true", label: "Enabled" },
  { value: "false", label: "Disabled" },
];

const emptyForm: DomainFormData = {
  domain: "",
  projectId: "",
  type: "main",
  sslEnabled: true,
  provider: "",
  dnsProvider: "",
  nameserversInput: "",
  notes: "",
  status: "active",
};

export default function DomainsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { items: domains, pages, loading, refetch } = usePaginatedList(domainService.list, { page, limit: 10 });

  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<DomainFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    projectService
      .list({ limit: 200 })
      .then((res) => setProjects(res.data.items))
      .catch((err) => toast.error(getErrorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projectOptions = [{ value: "", label: "— No Project —" }, ...projects.map((p) => ({ value: p._id, label: p.projectName }))];

  const projectIdOf = (d: Domain) => (typeof d.projectId === "string" ? d.projectId : d.projectId?._id || "");

  const projectNameOf = (d: Domain) => {
    if (!d.projectId) return "-";
    if (typeof d.projectId === "string") return projects.find((p) => p._id === d.projectId)?.projectName || "-";
    return d.projectId.projectName;
  };

  const openCreateDialog = () => {
    setSelectedDomain(null);
    setFormData(emptyForm);
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (d: Domain) => {
    setSelectedDomain(d);
    setFormData({
      domain: d.domain,
      projectId: projectIdOf(d),
      type: d.type,
      sslEnabled: d.sslEnabled,
      provider: d.provider || "",
      dnsProvider: d.dnsProvider || "",
      nameserversInput: (d.nameservers || []).join(", "),
      notes: d.notes || "",
      status: d.status,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.domain.trim()) newErrors.domain = "Domain is required";
    else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.domain)) newErrors.domain = "Invalid domain format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        domain: formData.domain,
        // Omit projectId entirely for "no project" — the backend setter only
        // treats a missing/undefined field as "no project", not "".
        projectId: formData.projectId || undefined,
        type: formData.type,
        sslEnabled: formData.sslEnabled,
        provider: formData.provider,
        dnsProvider: formData.dnsProvider,
        nameservers: formData.nameserversInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes: formData.notes,
        status: formData.status,
      };
      if (selectedDomain) {
        await domainService.update(selectedDomain._id, payload);
        toast.success("Domain updated");
      } else {
        await domainService.create(payload);
        toast.success("Domain created");
      }
      setIsDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedDomain) return;
    setDeleting(true);
    try {
      await domainService.remove(selectedDomain._id);
      toast.success("Domain deleted");
      setIsDeleteOpen(false);
      setSelectedDomain(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Domain>[] = [
    { header: "Domain", primary: true, render: (d) => <span className="font-medium">{d.domain}</span> },
    { header: "Project", render: (d) => projectNameOf(d) },
    { header: "Type", render: (d) => <Badge tone="neutral">{d.type}</Badge> },
    {
      header: "SSL",
      render: (d) =>
        d.sslEnabled ? (
          <Badge tone="success">
            <FiLock className="mr-1 inline h-3 w-3" />
            Enabled
          </Badge>
        ) : (
          <Badge tone="neutral">Disabled</Badge>
        ),
    },
    { header: "Status", render: (d) => <StatusBadge status={d.status} /> },
    {
      header: "Actions",
      align: "right",
      render: (d) => (
        <RowActions>
          <EditAction onClick={() => openEditDialog(d)} />
          <DeleteAction
            onClick={() => {
              setSelectedDomain(d);
              setIsDeleteOpen(true);
            }}
          />
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Domains"
        description="Manage client project domains and SSL"
        actions={
          <Button icon={<FiPlus className="h-4 w-4" />} onClick={openCreateDialog}>
            Add Domain
          </Button>
        }
      />

      <Table
        columns={columns}
        data={domains}
        loading={loading}
        keyField={(row) => row._id}
        emptyMessage="No domains found"
        pagination={{ currentPage: page, totalPages: pages, onPageChange: setPage }}
      />

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedDomain ? "Edit Domain" : "Add Domain"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {selectedDomain ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Domain"
            placeholder="example.com"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            error={errors.domain}
            required
          />
          <Select
            label="Project (Optional)"
            options={projectOptions}
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
          />
          <Select
            label="Type"
            options={TYPE_OPTIONS}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Domain["type"] })}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Domain["status"] })}
          />
          <Select
            label="SSL"
            options={SSL_OPTIONS}
            value={String(formData.sslEnabled)}
            onChange={(e) => setFormData({ ...formData, sslEnabled: e.target.value === "true" })}
          />
          <Input label="Provider" value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} />
          <Input
            label="DNS Provider"
            value={formData.dnsProvider}
            onChange={(e) => setFormData({ ...formData, dnsProvider: e.target.value })}
          />
          <Input
            label="Nameservers"
            hint="Comma-separated list, e.g. ns1.example.com, ns2.example.com"
            value={formData.nameserversInput}
            onChange={(e) => setFormData({ ...formData, nameserversInput: e.target.value })}
          />
          <Textarea label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </div>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Domain"
        description={`Delete ${selectedDomain?.domain}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
