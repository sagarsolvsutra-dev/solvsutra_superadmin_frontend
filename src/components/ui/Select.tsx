"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  selectedValue?: string;
  value?: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = "Select option",
  options,
  selectedValue,
  value,
  onChange,
  isRequired = false,
  required = false,
  error,
  helperText,
  className = "",
  disabled = false,
  searchable = true,
}) => {
  const finalValue = value !== undefined ? value : selectedValue;
  const finalRequired = isRequired || required;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === finalValue);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`} ref={selectRef}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 flex items-center gap-0.5">
          {label}
          {finalRequired && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 text-sm border rounded-lg bg-white transition-all duration-200 text-left flex items-center justify-between
            ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : "hover:border-gray-400 cursor-pointer"}
            ${error ? "border-red-500" : "border-gray-300"} ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
        >
          <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-fadeIn">
            {searchable && (
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">No options found</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-gray-50 transition-colors
                      ${option.value === finalValue ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.value === finalValue && <Check size={14} className="shrink-0 ml-2" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <span className="text-xs font-medium text-red-500">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-gray-500">{helperText}</span>
      ) : null}
    </div>
  );
};

export default Select;
