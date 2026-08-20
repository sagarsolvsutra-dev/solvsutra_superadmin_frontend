"use client";

import React from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    confirmVariant: "danger" as const,
    Icon: AlertTriangle,
    confirmClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    confirmVariant: "primary" as const,
    Icon: AlertTriangle,
    confirmClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  primary: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    confirmVariant: "primary" as const,
    Icon: Info,
    confirmClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
}) => {
  const config = variantConfig[variant];
  const Icon = config.Icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className={`shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1 text-sm text-gray-600">{message}</div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button className={config.confirmClass} onClick={handleConfirm} isLoading={isLoading}>
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
};
