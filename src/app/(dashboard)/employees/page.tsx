"use client";

import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { RowActions, EditAction, DeleteAction } from "@/components/ui/RowActions";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { employeeService } from "@/services/employee.service";
import { userService } from "@/services/user.service";
import { getErrorMessage } from "@/lib/api";
import { formatDate, toDateInputValue } from "@/lib/utils";
import type { Employee, User } from "@/types";

type EmployeeFormData = {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joinDate: string;
  employmentStatus: Employee["employmentStatus"];
  address: string;
  userId: string;
  notes: string;
};

const emptyForm: EmployeeFormData = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  joinDate: "",
  employmentStatus: "active",
  address: "",
  userId: "",
  notes: "",
};

const statusOptions: { value: Employee["employmentStatus"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
];

const statusFilterOptions = [{ value: "", label: "All Status" }, ...statusOptions];

const statusTone = (status: Employee["employmentStatus"]) =>
  status === "active" ? "success" : status === "on_leave" ? "warning" : "neutral";

const linkedUserName = (userId: Employee["userId"]) => (typeof userId === "object" && userId ? userId.name : "");

export default function EmployeesPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { items, pages, loading, refetch } = usePaginatedList<Employee>(employeeService.list, {
    search,
    page,
    limit: 10,
    extraParams: { employmentStatus: statusFilter || undefined },
  });

  const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([]);
  useEffect(() => {
    userService
      .list()
      .then((res) => {
        const users = (res.data as { users: User[] }).users ?? [];
        setUserOptions(users.map((u) => ({ label: `${u.name} (${u.email})`, value: u._id })));
      })
      .catch(() => {});
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setSelectedEmployee(null);
    setFormData(emptyForm);
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "",
      designation: employee.designation || "",
      joinDate: toDateInputValue(employee.joinDate),
      employmentStatus: employee.employmentStatus,
      address: employee.address || "",
      userId: typeof employee.userId === "object" ? employee.userId?._id || "" : employee.userId || "",
      notes: employee.notes || "",
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) newErrors.phone = "Phone number must be exactly 10 digits";
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format";
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
      const payload = { ...formData, userId: formData.userId || undefined };
      if (selectedEmployee) {
        await employeeService.update(selectedEmployee._id, payload);
        toast.success("Employee updated successfully");
      } else {
        await employeeService.create(payload);
        toast.success("Employee added successfully");
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
      await employeeService.remove(deleteTarget._id);
      toast.success("Employee deleted successfully");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Employee>[] = [
    {
      header: "Employee ID",
      render: (row) => <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{row.employeeId}</span>,
    },
    { header: "Name", primary: true, render: (row) => <span className="font-medium">{row.name}</span> },
    { header: "Designation", render: (row) => row.designation || "-" },
    { header: "Department", render: (row) => row.department || "-" },
    { header: "Phone", render: (row) => row.phone || "-" },
    {
      header: "Status",
      render: (row) => <Badge tone={statusTone(row.employmentStatus)}>{statusOptions.find((s) => s.value === row.employmentStatus)?.label}</Badge>,
    },
    { header: "Join Date", render: (row) => formatDate(row.joinDate) },
    {
      header: "Login Account",
      render: (row) => (linkedUserName(row.userId) ? <Badge tone="info">{linkedUserName(row.userId)}</Badge> : <span className="text-slate-400">-</span>),
    },
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
        title="Employees"
        description="Manage your team — staff directory, department and role"
        actions={
          <Button icon={<FiPlus className="h-4 w-4" />} onClick={openCreate}>
            Add Employee
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search employees..."
        />
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          wrapperClassName="w-full sm:w-44"
        />
      </div>

      <Table
        columns={columns}
        data={items}
        keyField={(row) => row._id}
        loading={loading}
        emptyMessage="No employees found"
        pagination={{ currentPage: page, totalPages: pages, onPageChange: setPage }}
      />

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedEmployee ? "Edit Employee" : "Add Employee"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {selectedEmployee ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            required
            error={errors.name}
            wrapperClassName="sm:col-span-2"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit number"
            error={errors.phone}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
          />
          <Input
            label="Designation"
            placeholder="e.g. Backend Developer"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          />
          <Input
            label="Department"
            placeholder="e.g. Engineering"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <Input
            label="Join Date"
            type="date"
            value={formData.joinDate}
            onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
          />
          <Select
            label="Employment Status"
            options={statusOptions}
            value={formData.employmentStatus}
            onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as Employee["employmentStatus"] })}
          />
          <Select
            label="Linked Login Account"
            placeholder="No login account"
            hint="Only if this employee also signs into this panel"
            options={userOptions}
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            wrapperClassName="sm:col-span-2"
          />
          <Textarea
            label="Address"
            className="sm:col-span-2"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Textarea
            label="Notes"
            className="sm:col-span-2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Employee"
        description={`Are you sure you want to remove "${deleteTarget?.name}" from the employee directory? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
