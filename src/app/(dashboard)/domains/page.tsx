"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/apiClient";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Domain {
  _id: string;
  domainId: string;
  domain: string;
  projectId?: { _id: string; projectName: string };
  type: "main" | "subdomain" | "redirect";
  sslEnabled: boolean;
  provider?: string;
  dnsProvider?: string;
  status: "active" | "pending" | "expired" | "suspended";
  createdAt: string;
}

interface Project {
  _id: string;
  projectId: string;
  projectName: string;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    domain: "",
    projectId: "",
    type: "main" as Domain["type"],
    sslEnabled: true,
    provider: "",
    dnsProvider: "",
    status: "active" as Domain["status"],
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [domainsRes, projectsRes] = await Promise.all([
        api.getDomains(),
        api.getProjects(),
      ]);
      setDomains(domainsRes.domains || []);
      setProjects(projectsRes.projects || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.domain) { toast.error("Domain is required"); return; }
    setSubmitting(true);
    try {
      // Only send projectId if a project is selected
      const submitData = {
        ...formData,
        projectId: formData.projectId || undefined,
      };
      if (selectedDomain) {
        await api.updateDomain(selectedDomain._id, submitData);
        toast.success("Domain updated");
      } else {
        await api.createDomain(submitData);
        toast.success("Domain created");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save domain");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedDomain) return;
    try {
      await api.deleteDomain(selectedDomain._id);
      toast.success("Domain deleted");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
    setIsDeleteOpen(false);
    setSelectedDomain(null);
  };

  const columns: Column<Domain>[] = [
    { key: "domain", header: "Domain", render: (d) => <span className="font-medium">{d.domain}</span> },
    { key: "project", header: "Project", render: (d) => d.projectId?.projectName || "-" },
    { key: "type", header: "Type", render: (d) => <Badge variant="gray">{d.type}</Badge> },
    { key: "ssl", header: "SSL", render: (d) => d.sslEnabled ? <Badge variant="success"><Lock size={10} className="mr-1" />Enabled</Badge> : <Badge variant="gray">Disabled</Badge> },
    { key: "status", header: "Status", render: (d) => <Badge variant={d.status === "active" ? "success" : d.status === "pending" ? "warning" : "danger"}>{d.status}</Badge> },
    { key: "actions", header: "", align: "right", render: (d) => (
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => { setSelectedDomain(d); setFormData({ domain: d.domain, projectId: d.projectId?._id || "", type: d.type, sslEnabled: d.sslEnabled, provider: d.provider || "", dnsProvider: d.dnsProvider || "", status: d.status }); setIsDialogOpen(true); }}><Edit2 size={14} /></Button>
        <Button size="sm" variant="ghost" onClick={() => { setSelectedDomain(d); setIsDeleteOpen(true); }}><Trash2 size={14} /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Domains</h1>
          <p className="text-sm text-gray-500 mt-1">Manage client project domains and SSL</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => { setSelectedDomain(null); setFormData({ domain: "", projectId: "", type: "main", sslEnabled: true, provider: "", dnsProvider: "", status: "active" }); setIsDialogOpen(true); }}>
          Add Domain
        </Button>
      </div>
      {loading ? <TableSkeleton rows={5} cols={6} /> : <Table columns={columns} data={domains} />}
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={selectedDomain ? "Edit Domain" : "Add Domain"} overflowVisible footer={<><Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit} isLoading={submitting}>{selectedDomain ? "Update" : "Create"}</Button></>}>
        <div className="space-y-4">
          <Input label="Domain" placeholder="example.com" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} isRequired />
          <Select
            label="Project (Optional)"
            options={[{ value: "", label: "— No Project —" }, ...projects.map(p => ({ value: p._id, label: p.projectName }))]}
            value={formData.projectId}
            onChange={(v) => setFormData({ ...formData, projectId: v })}
          />
          <Select label="Type" options={[{ value: "main", label: "Main" }, { value: "subdomain", label: "Subdomain" }, { value: "redirect", label: "Redirect" }]} value={formData.type} onChange={(v) => setFormData({ ...formData, type: v as Domain["type"] })} />
          <Select label="Status" options={[{ value: "active", label: "Active" }, { value: "pending", label: "Pending" }, { value: "expired", label: "Expired" }, { value: "suspended", label: "Suspended" }]} value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as Domain["status"] })} />
          <Input label="Provider" value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} />
          <Input label="DNS Provider" value={formData.dnsProvider} onChange={(e) => setFormData({ ...formData, dnsProvider: e.target.value })} />
        </div>
      </Dialog>
      <ConfirmationDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={confirmDelete} title="Delete Domain" message={`Delete ${selectedDomain?.domain}?`} confirmText="Delete" variant="danger" />
    </div>
  );
}
