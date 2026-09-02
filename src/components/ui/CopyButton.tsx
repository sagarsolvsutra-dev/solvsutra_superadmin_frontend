"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  /** The text placed on the clipboard. */
  value?: string | null;
  /** Shown in the tooltip, e.g. "Copy API key". */
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Copies `value` and briefly confirms with a tick.
 *
 * navigator.clipboard is unavailable on insecure origins (plain http on a LAN
 * IP, which is exactly how this panel is often reached), so there is a
 * execCommand fallback — otherwise the button would silently do nothing.
 */
export function CopyButton({ value, label = "Copy", className, size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = useCallback(async () => {
    if (!value) return;

    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch {
      ok = false;
    }

    if (!ok) {
      // Fallback for http:// origins where the Clipboard API is blocked.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
    }

    if (ok) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }
  }, [value]);

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      title={copied ? "Copied" : label}
      aria-label={copied ? "Copied" : label}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 transition",
        copied
          ? "text-emerald-600"
          : "text-slate-400 hover:bg-slate-200/70 hover:text-slate-700",
        !value && "cursor-not-allowed opacity-40",
        className
      )}
    >
      {copied ? <FiCheck className={iconSize} /> : <FiCopy className={iconSize} />}
      {copied && <span className="text-[11px] font-medium">Copied</span>}
    </button>
  );
}

export default CopyButton;
