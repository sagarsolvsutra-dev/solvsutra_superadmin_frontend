"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/Badge";
import { RowActions, EditAction, DeleteAction } from "@/components/ui/RowActions";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { getErrorMessage } from "@/lib/api";
import { clientService } from "@/services/client.service";
import { formatDate } from "@/lib/utils";
import type { Client } from "@/types";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const emptyForm = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  gstNumber: "",
  status: "active",
  notes: "",
};

type ClientForm = typeof emptyForm;

export default function ClientsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { items, pages, loading, refetch } = usePaginatedList<Client>(clientService.list, {
    search,
    page,
    limit: 10,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setSelectedClient(null);
    setFormData(emptyForm);
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      companyName: client.companyName,
      contactPerson: client.contactPerson || "",
      email: client.email,
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      country: client.country || "India",
      gstNumber: client.gstNumber || "",
      status: client.status,
      notes: client.notes || "",
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }
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
      if (selectedClient) {
        await clientService.update(selectedClient._id, formData);
        toast.success("Client updated successfully");
      } else {
        await clientService.create(formData);
        toast.success("Client created successfully");
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
      await clientService.remove(deleteTarget._id);
      toast.success("Client deleted successfully");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Client>[] = [
    {
      header: "Client ID",
      render: (row) => <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{row.clientId}</span>,
    },
    { header: "Company Name", primary: true, render: (row) => <span className="font-medium">{row.companyName}</span> },
    { header: "Contact Person", render: (row) => row.contactPerson || "-" },
    { header: "Email", render: (row) => row.email },
    { header: "Phone", render: (row) => row.phone || "-" },
    { header: "City", render: (row) => row.city || "-" },
    { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { header: "Created", render: (row) => formatDate(row.createdAt) },
    {
      header: "Actions",
      align: "center",
      render: (row) => (
        <RowActions>
          <EditAction onClick={() => openEdit(row)} />
          <DeleteAction onClick={() => setDeleteTarget(row)} />
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage your client companies"
        actions={
          <Button icon={<FiPlus className="h-4 w-4" />} onClick={openCreate}>
            Add Client
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search clients..."
        />
      </div>

      <Table
        columns={columns}
        data={items}
        keyField={(row) => row._id}
        loading={loading}
        emptyMessage="No clients found"
        pagination={{ currentPage: page, totalPages: pages, onPageChange: setPage }}
      />

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedClient ? "Edit Client" : "Add Client"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {selectedClient ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Company Name"
            required
            error={errors.companyName}
            wrapperClassName="sm:col-span-2"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            error={errors.email}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Phone"
            inputMode="numeric"
            maxLength={10}
            error={errors.phone}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />
          <Input
            label="Address"
            wrapperClassName="sm:col-span-2"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
          <Input label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
          <Input
            label="Country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
          <Input
            label="GST Number"
            value={formData.gstNumber}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
          />
          <Textarea
            label="Notes"
            className="sm:col-span-2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Client"
        description={`Are you sure you want to delete "${deleteTarget?.companyName}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
