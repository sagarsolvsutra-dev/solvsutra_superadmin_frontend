"use client";

import React from "react";
import { MoreVertical } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  skeletonRowsCount?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function Table<T extends { _id?: string; id?: string | number }>({
  columns,
  data,
  isLoading = false,
  skeletonRowsCount = 5,
  onRowClick,
  emptyMessage = "No data available",
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-900 text-white">
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={`px-5 py-3.5 text-${col.align || "left"} text-xs font-semibold uppercase tracking-wider ${
                  col.className || ""
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRowsCount }).map((_, idx) => (
              <tr key={idx} className="border-b border-gray-100 last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-16 text-center text-gray-500 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row._id || row.id || idx}
                className={`border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50/70 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`px-5 py-4 text-sm text-gray-700 text-${col.align || "left"} ${
                      col.className || ""
                    }`}
                  >
                    {col.render ? col.render(row, idx) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const ActionsCell: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
    >
      <MoreVertical className="h-4 w-4" />
    </button>
  );
};

export default Table;