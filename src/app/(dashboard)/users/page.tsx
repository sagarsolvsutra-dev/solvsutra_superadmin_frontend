"use client";

import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { RowActions, EditAction, DeleteAction } from "@/components/ui/RowActions";
import { useToast } from "@/components/ui/Toast";
import { userService } from "@/services/user.service";
import { getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { User, Role } from "@/types";

type UserFormData = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
};

const roleOptions: { value: Role; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "developer", label: "Developer" },
  { value: "accountant", label: "Accountant" },
  { value: "support", label: "Support" },
];

const emptyForm: UserFormData = { name: "", email: "", password: "", phone: "", role: "admin" };

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.list();
      setUsers((res.data as { users: User[] }).users ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err));
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

  const openCreateDialog = () => {
    setSelectedUser(null);
    setFormData(emptyForm);
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setSubmitting(true);
    try {
      if (selectedUser) {
        await userService.update(selectedUser._id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password || undefined,
        });
        toast.success("User updated successfully");
      } else {
        await userService.create(formData);
        toast.success("User created successfully");
      }
      setIsDialogOpen(false);
      setSelectedUser(null);
      setFormData(emptyForm);
      setErrors({});
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      await userService.remove(selectedUser._id);
      toast.success("User deleted successfully");
      setIsDeleteOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<User>[] = [
    { header: "Name", primary: true, render: (u) => <span className="font-medium">{u.name}</span> },
    { header: "Email", render: (u) => u.email },
    { header: "Role", render: (u) => <Badge tone={u.role === "super_admin" ? "info" : "neutral"}>{u.role}</Badge> },
    { header: "Status", render: (u) => <Badge tone={u.isActive ? "success" : "neutral"}>{u.isActive ? "Active" : "Inactive"}</Badge> },
    { header: "Last Login", render: (u) => formatDate(u.lastLogin) },
    {
      header: "Actions",
      align: "right",
      render: (u) => (
        <RowActions>
          <EditAction onClick={() => openEditDialog(u)} />
          {u.role !== "super_admin" && (
            <DeleteAction
              onClick={() => {
                setSelectedUser(u);
                setIsDeleteOpen(true);
              }}
            />
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage Super Admin users and their permissions"
        actions={
          <Button icon={<FiPlus className="h-4 w-4" />} onClick={openCreateDialog}>
            Add User
          </Button>
        }
      />

      <Table columns={columns} data={users} loading={loading} keyField={(row) => row._id} emptyMessage="No users found" />

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedUser ? "Edit User" : "Add User"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {selectedUser ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />
          <Input
            label="Phone"
            // Without these hints Chrome autofills the e-mail address into this
            // field, which then fails the 10-digit validation.
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            placeholder="10-digit number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
          />
          <Select
            label="Role"
            options={roleOptions}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            required
          />
          <PasswordInput
            label={selectedUser ? "New Password (leave blank to keep)" : "Password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            required={!selectedUser}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
