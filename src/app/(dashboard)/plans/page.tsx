"use client";

import React, { useState, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Plan {
  _id: string;
  planId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  durationUnit: "day" | "month" | "year";
  features: string[];
  isFree: boolean;
  status: "active" | "inactive";
  createdAt: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "INR",
    duration: 1,
    durationUnit: "year" as "day" | "month" | "year",
    features: "",
    isFree: false,
    status: "active" as "active" | "inactive",
    sortOrder: 0,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.getPlans();
      setPlans(res.plans);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    const matchesSearch = !searchTerm ||
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Plan name is required");
      return;
    }

    const featuresArray = formData.features.split("\n").filter((f) => f.trim());

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: formData.isFree ? 0 : formData.price,
        features: featuresArray,
      };

      if (selectedPlan) {
        await api.updatePlan(selectedPlan._id, payload);
        toast.success("Plan updated successfully");
      } else {
        await api.createPlan(payload);
        toast.success("Plan created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Failed to save plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      await api.deletePlan(selectedPlan._id);
      toast.success("Plan deleted successfully");
      setIsDeleteOpen(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete plan");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      currency: "INR",
      duration: 1,
      durationUnit: "year",
      features: "",
      isFree: false,
      status: "active",
      sortOrder: 0,
    });
    setSelectedPlan(null);
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(price);
  };

  const formatDuration = (duration: number, unit: string) => {
    if (duration === 1) return `1 ${unit}`;
    return `${duration} ${unit}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage subscription plans</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          Add Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search plans by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            options={[
              { value: "active", label: "Active Only" },
              { value: "inactive", label: "Inactive Only" },
              { value: "all", label: "All Plans" },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}
            searchable={false}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No plans found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description || "No description"}</p>
                </div>
                <Badge variant={plan.status === "active" ? "success" : "gray"}>{plan.status}</Badge>
              </div>
              <div className="mb-4">
                <span className="text-2xl font-bold text-gray-900">{formatPrice(plan.price, plan.currency)}</span>
                <span className="text-gray-500 text-sm">/{formatDuration(plan.duration, plan.durationUnit)}</span>
              </div>
              {plan.features.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="truncate">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 4 && <li className="text-xs text-gray-400">+{plan.features.length - 4} more features</li>}
                </ul>
              )}
              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedPlan(plan); setFormData({ name: plan.name, description: plan.description || "", price: plan.price, currency: plan.currency, duration: plan.duration, durationUnit: plan.durationUnit, features: plan.features.join("\n"), isFree: plan.isFree, status: plan.status, sortOrder: plan.sortOrder }); setIsDialogOpen(true); }}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { setSelectedPlan(plan); setIsDeleteOpen(true); }}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog isOpen={isDialogOpen} onClose={() => { setIsDialogOpen(false); resetForm(); }} title={selectedPlan ? "Edit Plan" : "Add Plan"} overflowVisible footer={<><Button variant="secondary" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button><Button onClick={handleSubmit} isLoading={submitting}>{selectedPlan ? "Update" : "Create"}</Button></>}>
        <div className="space-y-4">
          <Input label="Plan Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} isRequired />
          <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <div className="flex gap-4">
            <div className="flex-1">
              <Input label="Price (₹)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} disabled={formData.isFree} />
            </div>
            <div className="flex items-end gap-2">
              <Input label="Duration" type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })} className="w-20" />
              <Select label="Unit" options={[{ value: "day", label: "Day(s)" }, { value: "month", label: "Month(s)" }, { value: "year", label: "Year(s)" }]} value={formData.durationUnit} onChange={(v) => setFormData({ ...formData, durationUnit: v as any })} className="w-32" searchable={false} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Features (one per line)</label>
            <textarea value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} rows={5} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Feature 1&#10;Feature 2&#10;Feature 3" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isFree" checked={formData.isFree} onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="isFree" className="text-sm text-gray-700">This is a free plan</label>
          </div>
        </div>
      </Dialog>

      <ConfirmationDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Plan" message={`Are you sure you want to delete the "${selectedPlan?.name}" plan?`} confirmText={submitting ? "Deleting..." : "Delete"} variant="danger" />
    </div>
  );
}
