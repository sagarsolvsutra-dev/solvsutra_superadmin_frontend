"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, Column } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { RowActions, EditAction, DeleteAction } from "@/components/ui/RowActions";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { serverService } from "@/services/server.service";
import { getErrorMessage } from "@/lib/api";
import type { Server } from "@/types";

type ServerFormData = {
  name: string;
  provider: string;
  ipAddress: string;
  hostname: string;
  sshPort: number;
  os: string;
  ram: string;
  storage: string;
  notes: string;
  status: Server["status"];
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Maintenance" },
];

const emptyForm: ServerFormData = {
  name: "",
  provider: "",
  ipAddress: "",
  hostname: "",
  sshPort: 22,
  os: "",
  ram: "",
  storage: "",
  notes: "",
  status: "active",
};

export default function ServersPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { items: servers, pages, loading, refetch } = usePaginatedList(serverService.list, { page, limit: 10 });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<ServerFormData>(emptyForm);

  const openCreateDialog = () => {
    setSelectedServer(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (server: Server) => {
    setSelectedServer(server);
    setFormData({
      name: server.name,
      provider: server.provider || "",
      ipAddress: server.ipAddress || "",
      hostname: server.hostname || "",
      sshPort: server.sshPort ?? 22,
      os: server.os || "",
      ram: server.ram || "",
      storage: server.storage || "",
      notes: server.notes || "",
      status: server.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Server name is required");
      return;
    }
    setSubmitting(true);
    try {
      if (selectedServer) {
        await serverService.update(selectedServer._id, formData);
        toast.success("Server updated");
      } else {
        await serverService.create(formData);
        toast.success("Server created");
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
    if (!selectedServer) return;
    setDeleting(true);
    try {
      await serverService.remove(selectedServer._id);
      toast.success("Server deleted");
      setIsDeleteOpen(false);
      setSelectedServer(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Server>[] = [
    { header: "Server ID", render: (s) => <span className="font-mono text-xs">{s.serverId}</span> },
    { header: "Name", primary: true, render: (s) => <span className="font-medium">{s.name}</span> },
    { header: "Provider", render: (s) => s.provider || "-" },
    { header: "IP Address", render: (s) => <span className="font-mono text-xs">{s.ipAddress || "-"}</span> },
    { header: "OS", render: (s) => s.os || "-" },
    { header: "Status", render: (s) => <StatusBadge status={s.status} /> },
    {
      header: "Actions",
      align: "right",
      render: (s) => (
        <RowActions>
          <EditAction onClick={() => openEditDialog(s)} />
          <DeleteAction
            onClick={() => {
              setSelectedServer(s);
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
        title="Servers"
        description="Manage hosting servers and infrastructure"
        actions={
          <Button icon={<FiPlus className="h-4 w-4" />} onClick={openCreateDialog}>
            Add Server
          </Button>
        }
      />

      <Table
        columns={columns}
        data={servers}
        loading={loading}
        keyField={(row) => row._id}
        emptyMessage="No servers found"
        pagination={{ currentPage: page, totalPages: pages, onPageChange: setPage }}
      />

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedServer ? "Edit Server" : "Add Server"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {selectedServer ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <Input label="Provider" value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} />
          <Input label="IP Address" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} />
          <Input label="Hostname" value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })} />
          <Input label="OS" value={formData.os} onChange={(e) => setFormData({ ...formData, os: e.target.value })} />
          <Input label="RAM" value={formData.ram} onChange={(e) => setFormData({ ...formData, ram: e.target.value })} />
          <Input label="Storage" value={formData.storage} onChange={(e) => setFormData({ ...formData, storage: e.target.value })} />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Server["status"] })}
          />
          <div className="col-span-2">
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Server"
        description={`Delete ${selectedServer?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
