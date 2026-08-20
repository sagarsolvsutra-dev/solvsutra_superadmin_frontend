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

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "super_admin" | "admin" | "developer" | "accountant" | "support";
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "developer", label: "Developer" },
  { value: "accountant", label: "Accountant" },
  { value: "support", label: "Support" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "admin" as User["role"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (!selectedUser && !formData.password.trim()) {
      newErrors.password = "Password is required for new users";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
      if (selectedUser) {
        await api.updateUser(selectedUser._id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password || undefined,
        });
        toast.success("User updated successfully");
      } else {
        await api.register(formData);
        toast.success("User created successfully");
      }
      setIsDialogOpen(false);
      setSelectedUser(null);
      setFormData({ name: "", email: "", password: "", phone: "", role: "admin" });
      setErrors({});
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone || "",
      role: user.role,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await api.deleteUser(selectedUser._id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
    setIsDeleteOpen(false);
    setSelectedUser(null);
  };

  const columns: Column<User>[] = [
    { key: "name", header: "Name", render: (u) => <span className="font-medium">{u.name}</span> },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", render: (u) => <Badge variant={u.role === "super_admin" ? "info" : "gray"}>{u.role}</Badge> },
    { key: "isActive", header: "Status", render: (u) => <Badge variant={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Inactive"}</Badge> },
    { key: "lastLogin", header: "Last Login", render: (u) => u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "-" },
    { key: "actions", header: "Actions", align: "right", render: (u) => (
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(u)}><Edit2 size={14} /></Button>
        {u.role !== "super_admin" && <Button size="sm" variant="ghost" onClick={() => handleDelete(u)}><Trash2 size={14} /></Button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage Super Admin users and their permissions</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => { setSelectedUser(null); setFormData({ name: "", email: "", password: "", phone: "", role: "admin" }); setErrors({}); setIsDialogOpen(true); }}>
          Add User
        </Button>
      </div>

      {loading ? <TableSkeleton rows={5} cols={6} /> : <Table columns={columns} data={users} />}

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedUser ? "Edit User" : "Add User"}
        overflowVisible
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={submitting}>{selectedUser ? "Update" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} isRequired />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email} isRequired />
          <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} error={errors.phone} />
          <Select label="Role" options={roleOptions} value={formData.role} onChange={(v) => setFormData({ ...formData, role: v as User["role"] })} error={errors.role} isRequired />
          <Input label={selectedUser ? "New Password (leave blank to keep)" : "Password"} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} error={errors.password} isRequired={!selectedUser} />
        </div>
      </Dialog>

      <ConfirmationDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={confirmDelete} title="Delete User" message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`} confirmText="Delete" variant="danger" />
    </div>
  );
}
