"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** When true, Escape and backdrop-click are ignored — use while a submit/delete
   * request triggered from inside the dialog is still in flight, so the dialog
   * can't be dismissed mid-request. Callers already pass a `loading`/`submitting`
   * flag to their footer buttons for this; wire the same flag in here. */
  preventCloseWhileBusy?: boolean;
};

const SIZE_STYLES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  preventCloseWhileBusy = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (preventCloseWhileBusy) return;
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
          (el) => el.offsetParent !== null || el === document.activeElement
        );
        if (focusable.length === 0) {
          e.preventDefault();
          container.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !container.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !container.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, preventCloseWhileBusy]);

  // Move focus into the dialog on open, and restore it to whatever triggered
  // the dialog on close — otherwise focus is stranded on a trigger button
  // that's now behind the (visually blocking, but not keyboard-blocking)
  // overlay, or lost entirely if that trigger unmounts.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    const container = dialogRef.current;
    if (container) {
      const focusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusable ?? container).focus();
    }
    return () => {
      const trigger = triggerRef.current;
      if (trigger instanceof HTMLElement && document.contains(trigger)) {
        trigger.focus();
      }
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const handleClose = () => {
    if (preventCloseWhileBusy) return;
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "animate-dialog-in relative flex max-h-[90vh] w-full flex-col rounded-xl bg-white shadow-2xl focus:outline-none",
          SIZE_STYLES[size]
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
            <div>
              {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
            <button
              onClick={handleClose}
              disabled={preventCloseWhileBusy}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
