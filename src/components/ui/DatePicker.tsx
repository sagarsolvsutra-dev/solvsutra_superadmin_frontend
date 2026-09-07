"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn, formatDate } from "@/lib/utils";

interface DatePickerProps {
  label?: string;
  error?: string;
  hint?: string;
  value?: string; // "YYYY-MM-DD", same convention as <input type="date">
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  name?: string;
  id?: string;
  wrapperClassName?: string;
  className?: string;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toValue = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Parses "YYYY-MM-DD" as a local calendar date (not UTC) — `new Date(str)`
 * parses date-only strings as UTC midnight, which can render as the wrong
 * day once shifted into the browser's local timezone. */
function parseValue(value?: string): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function buildGrid(viewYear: number, viewMonth: number): Date[] {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  // Monday-start week: Sunday (0) needs 6 days back, Monday (1) needs 0, etc.
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(viewYear, viewMonth, 1 - leadingDays);
  return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

export function DatePicker({
  label,
  error,
  hint,
  value = "",
  onChange,
  placeholder = "Select date",
  required,
  disabled,
  min,
  max,
  name,
  id,
  wrapperClassName,
  className,
}: DatePickerProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => parseValue(value), [value]);
  const minDate = useMemo(() => parseValue(min) ?? undefined, [min]);
  const maxDate = useMemo(() => parseValue(max) ?? undefined, [max]);
  const today = useMemo(() => new Date(), []);

  const [viewYear, setViewYear] = useState(() => (selected ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected ?? today).getMonth());

  useEffect(() => {
    if (!open) return;
    const anchor = selected ?? today;
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const computePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
    setPos({ top: openUp ? rect.top : rect.bottom, left: rect.left, width: rect.width, openUp });
  };

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => computePosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDisabledDay = (d: Date) => (minDate && d < minDate) || (maxDate && d > maxDate);

  const selectDay = (d: Date) => {
    if (isDisabledDay(d)) return;
    onChange?.({ target: { value: toValue(d.getFullYear(), d.getMonth(), d.getDate()) } });
    setOpen(false);
  };

  const goToday = () => selectDay(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const clear = () => {
    onChange?.({ target: { value: "" } });
    setOpen(false);
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          id={inputId}
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "flex h-9.5 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-left text-sm transition-colors",
            "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            error && "border-red-400 focus:border-red-500 focus:ring-red-100",
            className
          )}
        >
          <span className={cn("truncate", selected ? "text-slate-900" : "text-slate-400")}>
            {selected ? formatDate(selected) : placeholder}
          </span>
          <FiCalendar className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        {name && <input type="hidden" name={name} value={value} />}
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            style={{
              position: "fixed",
              left: pos.left,
              zIndex: 1000,
              ...(pos.openUp ? { bottom: window.innerHeight - pos.top + 4 } : { top: pos.top + 4 }),
            }}
            className="w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Previous month"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-800">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Next month"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-0.5 px-2 pt-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="flex h-7 items-center justify-center text-[11px] font-semibold uppercase text-slate-400">
                  {w}
                </div>
              ))}
              {grid.map((d, i) => {
                const inMonth = d.getMonth() === viewMonth;
                const isSelected = selected && sameDay(d, selected);
                const isToday = sameDay(d, today);
                const disabledDay = isDisabledDay(d);
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => selectDay(d)}
                    disabled={disabledDay}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                      !inMonth && "text-slate-300",
                      inMonth && !isSelected && "text-slate-700 hover:bg-brand-50",
                      isSelected && "bg-brand-600 font-semibold text-white hover:bg-brand-600",
                      isToday && !isSelected && "font-semibold text-brand-600 ring-1 ring-inset ring-brand-200",
                      disabledDay && "cursor-not-allowed text-slate-200 hover:bg-transparent"
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
              <button type="button" onClick={clear} className="text-xs font-medium text-slate-500 hover:text-slate-700">
                Clear
              </button>
              <button type="button" onClick={goToday} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Today
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
