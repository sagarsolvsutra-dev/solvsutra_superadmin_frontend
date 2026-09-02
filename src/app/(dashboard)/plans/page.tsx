"use client";

import { useEffect, useState } from "react";
import { FiPlus, FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Pagination } from "@/components/ui/Pagination";
import { CardsGridSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { planService } from "@/services/plan.service";
import { getErrorMessage } from "@/lib/api";
import type { Plan } from "@/types";

type PlanFormState = {
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  durationUnit: "day" | "month" | "year";
  features: string;
  isFree: boolean;
  status: "active" | "inactive";
  sortOrder: number;
};

const EMPTY_FORM: PlanFormState = {
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
};

const STATUS_FILTER_OPTIONS = [
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
  { value: "all", label: "All Plans" },
];

const DURATION_UNIT_OPTIONS = [
  { value: "day", label: "Day(s)" },
  { value: "month", label: "Month(s)" },
  { value: "year", label: "Year(s)" },
];

function formatPrice(price: number, currency: string) {
  if (price === 0) return "Free";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

function formatDuration(duration: number, unit: string) {
  return duration === 1 ? `1 ${unit}` : `${duration} ${unit}s`;
}

export default function PlansPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [page, setPage] = useState(1);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PlanFormState>(EMPTY_FORM);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const {
    items: plans,
    total,
    pages,
    loading,
    refetch,
  } = usePaginatedList(planService.list, {
    search,
    page,
    limit: 9,
    extraParams: { status: statusFilter === "all" ? undefined : statusFilter },
  });

  const openCreateDialog = () => {
    setSelectedPlan(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      currency: plan.currency,
      duration: plan.duration,
      durationUnit: plan.durationUnit,
      features: plan.features.join("\n"),
      isFree: plan.isFree,
      status: plan.status,
      sortOrder: plan.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedPlan(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Plan name is required");
      return;
    }

    const featuresArray = formData.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: formData.isFree ? 0 : formData.price,
        features: featuresArray,
      };

      if (selectedPlan) {
        await planService.update(selectedPlan._id, payload);
        toast.success("Plan updated successfully");
      } else {
        await planService.create(payload);
        toast.success("Plan created successfully");
      }
      closeDialog();
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      await planService.remove(selectedPlan._id);
      toast.success("Plan deleted successfully");
      setIsDeleteOpen(false);
      setSelectedPlan(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Manage subscription plans"
        actions={
          <Button icon={<FiPlus className="h-4 w-4" />} onClick={openCreateDialog}>
            Add Plan
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search plans by name or description..." />
        <Select
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "active" | "inactive" | "all")}
          wrapperClassName="w-full sm:w-48"
        />
      </div>

      {loading ? (
        <CardsGridSkeleton count={9} lines={4} />
      ) : plans.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-sm text-slate-500">No plans found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan._id} className="flex flex-col">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{plan.description || "No description"}</p>
                </div>
                <StatusBadge status={plan.status} />
              </div>
              <div className="mb-4">
                <span className="text-2xl font-bold text-slate-900">{formatPrice(plan.price, plan.currency)}</span>
                <span className="text-sm text-slate-500">/{formatDuration(plan.duration, plan.durationUnit)}</span>
              </div>
              {plan.features.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <FiCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="truncate">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-xs text-slate-400">+{plan.features.length - 4} more features</li>
                  )}
                </ul>
              )}
              <div className="mt-auto flex gap-2 border-t border-slate-100 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  icon={<FiEdit2 className="h-3.5 w-3.5" />}
                  onClick={() => openEditDialog(plan)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-red-600 hover:bg-red-50"
                  icon={<FiTrash2 className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setIsDeleteOpen(true);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && <Pagination page={page} pages={pages} total={total} onPageChange={setPage} limit={9} />}

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        title={selectedPlan ? "Edit Plan" : "Add Plan"}
        footer={
          <>
            <Button variant="secondary" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {selectedPlan ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Plan Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex gap-4">
            <Input
              label="Price (₹)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              disabled={formData.isFree}
              wrapperClassName="flex-1"
            />
            <Input
              label="Duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 1 })}
              wrapperClassName="w-24"
            />
            <Select
              label="Unit"
              options={DURATION_UNIT_OPTIONS}
              value={formData.durationUnit}
              onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value as "day" | "month" | "year" })}
              wrapperClassName="w-32"
            />
          </div>
          <Textarea
            label="Features (one per line)"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            rows={5}
            placeholder={"Feature 1\nFeature 2\nFeature 3"}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFree"
              checked={formData.isFree}
              onChange={(e) =>
                setFormData({ ...formData, isFree: e.target.checked, price: e.target.checked ? 0 : formData.price })
              }
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="isFree" className="text-sm text-slate-700">
              This is a free plan
            </label>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Plan"
        description={`Are you sure you want to delete the "${selectedPlan?.name}" plan? This action cannot be undone.`}
        confirmLabel={submitting ? "Deleting..." : "Delete"}
        variant="danger"
        loading={submitting}
      />
    </div>
  );
}
