"use client";

import React from "react";

export interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gray";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  children,
  className = "",
}) => {
  const variants = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

// Status-specific badges
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    active: { variant: "success", label: "Active" },
    inactive: { variant: "gray", label: "Inactive" },
    suspended: { variant: "danger", label: "Suspended" },
    pending: { variant: "warning", label: "Pending" },
    expiring: { variant: "warning", label: "Expiring" },
    expired: { variant: "danger", label: "Expired" },
    grace_period: { variant: "warning", label: "Grace Period" },
    cancelled: { variant: "gray", label: "Cancelled" },
    success: { variant: "success", label: "Success" },
    failed: { variant: "danger", label: "Failed" },
    paid: { variant: "success", label: "Paid" },
    unpaid: { variant: "warning", label: "Unpaid" },
  };

  const config = statusConfig[status] || { variant: "default", label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
