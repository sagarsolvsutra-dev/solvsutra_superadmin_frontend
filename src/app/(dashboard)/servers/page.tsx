"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
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

interface Server {
  _id: string;
  serverId: string;
  name: string;
  provider?: string;
  ipAddress?: string;
  hostname?: string;
  os?: string;
  ram?: string;
  storage?: string;
  status: "active" | "inactive" | "maintenance";
  createdAt: string;
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    ipAddress: "",
    hostname: "",
    sshPort: 22,
    os: "",
    ram: "",
    storage: "",
    notes: "",
    status: "active" as Server["status"],
  });

  useEffect(() => { fetchServers(); }, []);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const res = await api.getServers();
      setServers(res.servers);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch servers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) { toast.error("Server name is required"); return; }
    setSubmitting(true);
    try {
      if (selectedServer) {
        await api.updateServer(selectedServer._id, formData);
        toast.success("Server updated");
      } else {
        await api.createServer(formData);
        toast.success("Server created");
      }
      setIsDialogOpen(false);
      fetchServers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (server: Server) => {
    setSelectedServer(server);
    setFormData({ name: server.name, provider: server.provider || "", ipAddress: server.ipAddress || "", hostname: server.hostname || "", sshPort: 22, os: server.os || "", ram: server.ram || "", storage: server.storage || "", notes: "", status: server.status });
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedServer) return;
    try {
      await api.deleteServer(selectedServer._id);
      toast.success("Server deleted");
      fetchServers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
    setIsDeleteOpen(false);
    setSelectedServer(null);
  };

  const columns: Column<Server>[] = [
    { key: "serverId", header: "Server ID", render: (s) => <span className="font-mono text-xs">{s.serverId}</span> },
    { key: "name", header: "Name", render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "provider", header: "Provider" },
    { key: "ipAddress", header: "IP Address", render: (s) => <span className="font-mono text-xs">{s.ipAddress || "-"}</span> },
    { key: "os", header: "OS" },
    { key: "status", header: "Status", render: (s) => <Badge variant={s.status === "active" ? "success" : s.status === "maintenance" ? "warning" : "gray"}>{s.status}</Badge> },
    { key: "actions", header: "", align: "right", render: (s) => (
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}><Edit2 size={14} /></Button>
        <Button size="sm" variant="ghost" onClick={() => { setSelectedServer(s); setIsDeleteOpen(true); }}><Trash2 size={14} /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hosting servers and infrastructure</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => { setSelectedServer(null); setFormData({ name: "", provider: "", ipAddress: "", hostname: "", sshPort: 22, os: "", ram: "", storage: "", notes: "", status: "active" }); setIsDialogOpen(true); }}>
          Add Server
        </Button>
      </div>
      {loading ? <TableSkeleton rows={5} cols={6} /> : <Table columns={columns} data={servers} />}
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title={selectedServer ? "Edit Server" : "Add Server"} overflowVisible footer={<><Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit} isLoading={submitting}>{selectedServer ? "Update" : "Create"}</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} isRequired className="col-span-2" />
          <Input label="Provider" value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} />
          <Input label="IP Address" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} />
          <Input label="Hostname" value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })} />
          <Input label="OS" value={formData.os} onChange={(e) => setFormData({ ...formData, os: e.target.value })} />
          <Input label="RAM" value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} />
          <Input label="Storage" value={formData.storage} onChange={(e) => setFormData({ ...formData, storage: e.target.value })} />
          <Select label="Status" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "maintenance", label: "Maintenance" }]} value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as Server["status"] })} />
        </div>
      </Dialog>
      <ConfirmationDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={confirmDelete} title="Delete Server" message={`Delete ${selectedServer?.name}?`} confirmText="Delete" variant="danger" />
    </div>
  );
}
