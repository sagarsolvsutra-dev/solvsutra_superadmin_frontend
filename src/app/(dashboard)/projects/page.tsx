"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Key, RefreshCw } from "lucide-react";
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

interface Project {
  _id: string;
  projectId: string;
  projectName: string;
  description?: string;
  clientId: { _id: string; companyName: string };
  frontendUrl?: string;
  adminUrl?: string;
  backendUrl?: string;
  environment: "development" | "staging" | "production";
  status: "active" | "inactive" | "suspended";
  apiKey?: string;
  createdAt: string;
}

interface Client {
  _id: string;
  clientId: string;
  companyName: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [search, statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.getProjects(params.toString());
      setProjects(res.projects);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.getClients();
      setClients(res.clients);
    } catch (error) {
      console.error("Failed to fetch clients");
    }
  };

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.projectName) {
      toast.error("Client and project name are required");
      return;
    }

    setSubmitting(true);
    try {
      if (selectedProject) {
        await api.updateProject(selectedProject._id, formData);
        toast.success("Project updated successfully");
      } else {
        await api.createProject(formData);
        toast.success("Project created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to save project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      await api.deleteProject(selectedProject._id);
      toast.success("Project deleted successfully");
      setIsDeleteOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateCredentials = async () => {
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      const res = await api.regenerateCredentials(selectedProject._id);
      toast.success("Credentials regenerated");
      setIsCredentialsOpen(false);
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate credentials");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
    });
    setSelectedProject(null);
  };

  const columns: Column<Project>[] = [
    {
      key: "projectId",
      header: "Project ID",
      render: (row) => <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{row.projectId}</span>,
    },
    { key: "projectName", header: "Project Name" },
    { key: "clientName", header: "Client", render: (row) => (row.clientId as any)?.companyName || "-" },
    {
      key: "environment",
      header: "Environment",
      render: (row) => (
        <Badge variant={row.environment === "production" ? "info" : row.environment === "staging" ? "warning" : "gray"}>
          {row.environment}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : row.status === "suspended" ? "danger" : "gray"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "frontendUrl",
      header: "Frontend",
      render: (row) =>
        row.frontendUrl ? (
          <a href={row.frontendUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
            Link
          </a>
        ) : (
          "-"
        ),
    },
    { key: "createdAt", header: "Created", render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN") },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => { setSelectedProject(row); setIsCredentialsOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Credentials">
            <Key className="h-4 w-4" />
          </button>
          <button onClick={() => { setSelectedProject(row); setFormData({ ...formData, clientId: (row.clientId as any)?._id || "", projectName: row.projectName, description: row.description || "", frontendUrl: row.frontendUrl || "", adminUrl: row.adminUrl || "", backendUrl: row.backendUrl || "", repositoryUrl: row.repositoryUrl || "", environment: row.environment, techStack: row.techStack || "", domain: row.domain || "", status: row.status }); setIsDialogOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded text-blue-600">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => { setSelectedProject(row); setIsDeleteOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const clientOptions = clients.map((c) => ({ value: c._id, label: c.companyName }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage client projects</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          Add Project
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <Select placeholder="All Status" options={[{ value: "", label: "All Status" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "suspended", label: "Suspended" }]} value={statusFilter} onChange={setStatusFilter} className="w-40" searchable={false} />
      </div>

      {loading ? <TableSkeleton rows={5} cols={8} /> : <Table columns={columns} data={projects} />}

      {/* Add/Edit Dialog */}
      <Dialog isOpen={isDialogOpen} onClose={() => { setIsDialogOpen(false); resetForm(); }} title={selectedProject ? "Edit Project" : "Add Project"} size="lg" overflowVisible footer={<><Button variant="secondary" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button><Button onClick={handleSubmit} isLoading={submitting}>{selectedProject ? "Update" : "Create"}</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Select label="Client" placeholder="Select client" options={clientOptions} value={formData.clientId} onChange={(v) => setFormData({ ...formData, clientId: v })} isRequired />
          </div>
          <div className="col-span-2">
            <Input label="Project Name" value={formData.projectName} onChange={(e) => setFormData({ ...formData, projectName: e.target.value })} isRequired />
          </div>
          <div className="col-span-2">
            <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <Input label="Frontend URL" value={formData.frontendUrl} onChange={(e) => setFormData({ ...formData, frontendUrl: e.target.value })} />
          <Input label="Admin URL" value={formData.adminUrl} onChange={(e) => setFormData({ ...formData, adminUrl: e.target.value })} />
          <Input label="Backend URL" value={formData.backendUrl} onChange={(e) => setFormData({ ...formData, backendUrl: e.target.value })} />
          <Input label="Repository URL" value={formData.repositoryUrl} onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })} />
          <Select label="Environment" options={[{ value: "development", label: "Development" }, { value: "staging", label: "Staging" }, { value: "production", label: "Production" }]} value={formData.environment} onChange={(v) => setFormData({ ...formData, environment: v as any })} />
          <Select label="Status" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "suspended", label: "Suspended" }]} value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as any })} />
        </div>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog isOpen={isCredentialsOpen} onClose={() => setIsCredentialsOpen(false)} title="Project Credentials" size="md" footer={<Button variant="secondary" onClick={() => setIsCredentialsOpen(false)}>Close</Button>}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700">Project ID</label>
            <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded mt-1">{selectedProject?.projectId}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">API Key</label>
            <p className="font-mono text-xs bg-gray-100 px-3 py-2 rounded mt-1 break-all">{selectedProject?.apiKey || "Regenerate to get credentials"}</p>
          </div>
          <div className="pt-4 border-t">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRegenerateCredentials} isLoading={submitting}>
              Regenerate Credentials
            </Button>
            <p className="text-xs text-gray-500 mt-2">Warning: Regenerating will invalidate the existing API key.</p>
          </div>
        </div>
      </Dialog>

      <ConfirmationDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Project" message={`Are you sure you want to delete "${selectedProject?.projectName}"?`} confirmText={submitting ? "Deleting..." : "Delete"} variant="danger" />
    </div>
  );
}
