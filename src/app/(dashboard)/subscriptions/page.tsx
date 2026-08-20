"use client";

import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/apiClient";
import { Table, Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Subscription {
  _id: string;
  subscriptionId: string;
  clientId: { _id: string; companyName: string; email: string };
  projectId: { _id: string; projectName: string };
  planId: { _id: string; name: string; price: number; duration: number; durationUnit: string };
  startDate: string;
  expiryDate: string;
  status: "pending" | "active" | "expiring" | "expired" | "grace_period" | "suspended" | "cancelled";
  renewalCount: number;
  autoRenew: boolean;
  createdAt: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    planId: "",
    startDate: "",
    gracePeriodDays: 7,
    autoRenew: false,
  });
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetchSubscriptions();
    fetchDropdowns();
  }, [statusFilter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.getSubscriptions(statusFilter ? `status=${statusFilter}` : "");
      setSubscriptions(res.subscriptions);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [clientsRes, plansRes] = await Promise.all([
        api.getClients(),
        api.getPlans(),
      ]);
      setClients(clientsRes.clients.map((c: any) => ({ value: c._id, label: c.companyName })));
      setPlans(plansRes.plans.map((p: any) => ({ value: p._id, label: `${p.name} - ₹${p.price}` })));
    } catch (error) {
      console.error("Failed to fetch dropdowns:", error);
    }
  };

  const fetchProjectsByClient = async (clientId: string) => {
    try {
      const res = await api.getProjects({ clientId });
      setProjects(res.projects.map((p: any) => ({ value: p._id, label: p.projectName })));
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.projectId || !formData.planId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.createSubscription(formData);
      toast.success("Subscription created successfully");
      setIsDialogOpen(false);
      fetchSubscriptions();
      setFormData({ clientId: "", projectId: "", planId: "", startDate: "", gracePeriodDays: 7, autoRenew: false });
    } catch (error: any) {
      toast.error(error.message || "Failed to create subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any }> = {
      active: { variant: "success", icon: CheckCircle },
      expiring: { variant: "warning", icon: AlertTriangle },
      expired: { variant: "danger", icon: AlertTriangle },
      grace_period: { variant: "warning", icon: AlertTriangle },
      suspended: { variant: "danger", icon: AlertTriangle },
      pending: { variant: "info", icon: Calendar },
      cancelled: { variant: "gray", icon: Calendar },
    };
    const c = config[status] || { variant: "default", icon: Calendar };
    return (
      <Badge variant={c.variant}>
        <c.icon className="w-3 h-3 mr-1" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getDaysRemaining = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const columns: Column<Subscription>[] = [
    { key: "subscriptionId", header: "ID" },
    { key: "projectName", header: "Project", render: (row) => (row.projectId as any)?.projectName },
    { key: "clientName", header: "Client", render: (row) => (row.clientId as any)?.companyName },
    { key: "planName", header: "Plan", render: (row) => (row.planId as any)?.name },
    {
      key: "expiryDate", header: "Expiry", render: (row) => {
        const days = getDaysRemaining(row.expiryDate);
        return (
          <div>
            <div>{new Date(row.expiryDate).toLocaleDateString("en-IN")}</div>
            <div className={`text-xs ${days <= 7 ? "text-red-500 font-medium" : days <= 30 ? "text-amber-500" : "text-gray-500"}`}>
              {days > 0 ? `${days} days left` : "Expired"}
            </div>
          </div>
        );
      }
    },
    { key: "status", header: "Status", render: (row) => getStatusBadge(row.status) },
    { key: "renewalCount", header: "Renewals" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage client subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => fetchSubscriptions()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            New Subscription
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Select
            label="Status"
            placeholder="All Status"
            options={[
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "expiring", label: "Expiring" },
              { value: "expired", label: "Expired" },
              { value: "grace_period", label: "Grace Period" },
              { value: "suspended", label: "Suspended" },
            ]}
            selectedValue={statusFilter}
            onChange={setStatusFilter}
            className="w-48"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : (
        <Table columns={columns} data={subscriptions} />
      )}

      {/* Create Subscription Dialog */}
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Create Subscription" size="lg" overflowVisible>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Client"
            options={clients}
            selectedValue={formData.clientId}
            onChange={(v) => { setFormData({ ...formData, clientId: v, projectId: "" }); fetchProjectsByClient(v); }}
            isRequired
          />
          <Select
            label="Project"
            options={projects}
            selectedValue={formData.projectId}
            onChange={(v) => setFormData({ ...formData, projectId: v })}
            isRequired
            disabled={!formData.clientId}
          />
          <Select
            label="Plan"
            options={plans}
            selectedValue={formData.planId}
            onChange={(v) => setFormData({ ...formData, planId: v })}
            isRequired
          />
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            label="Grace Period (days)"
            type="number"
            value={formData.gracePeriodDays}
            onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) || 7 })}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={submitting}>Create Subscription</Button>
        </div>
      </Dialog>
    </div>
  );
}
