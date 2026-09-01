"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/apiClient";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Client {
  _id: string;
  clientId: string;
  companyName: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  gstNumber?: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClients();
  }, [search]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.getClients(search);
      setClients(res.clients);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setSubmitting(true);
    try {
      if (selectedClient) {
        await api.updateClient(selectedClient._id, formData);
        toast.success("Client updated successfully");
      } else {
        await api.createClient(formData);
        toast.success("Client created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      toast.error(error.message || "Failed to save client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      companyName: client.companyName,
      contactPerson: client.contactPerson || "",
      email: client.email,
      phone: client.phone || "",
      address: "",
      city: client.city || "",
      state: client.state || "",
      country: client.country || "India",
      gstNumber: client.gstNumber || "",
      status: client.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    setSubmitting(true);
    try {
      await api.deleteClient(selectedClient._id);
      toast.success("Client deleted successfully");
      setIsDeleteOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete client");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
    });
    setErrors({});
    setSelectedClient(null);
  };

  const columns: Column<Client>[] = [
    {
      key: "clientId",
      header: "Client ID",
      render: (row) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{row.clientId}</span>
      ),
    },
    { key: "companyName", header: "Company Name" },
    { key: "contactPerson", header: "Contact Person" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "city", header: "City" },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={row.status === "active" ? "success" : row.status === "suspended" ? "danger" : "gray"}>{row.status}</Badge>,
    },
    { key: "createdAt", header: "Created", render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN") },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => handleEdit(row)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => { setSelectedClient(row); setIsDeleteOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client companies</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : (
        <Table columns={columns} data={clients} />
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); resetForm(); }}
        title={selectedClient ? "Edit Client" : "Add Client"}
        overflowVisible
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={submitting}>{selectedClient ? "Update" : "Create"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Company Name" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} error={errors.companyName} isRequired />
          </div>
          <Input label="Contact Person" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} error={errors.contactPerson} />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email} isRequired />
          <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} error={errors.phone} />
          <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} error={errors.city} />
          <Input label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} error={errors.state} />
          <Input label="GST Number" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} error={errors.gstNumber} />
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${selectedClient?.companyName}"? This action cannot be undone.`}
        confirmText={submitting ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
