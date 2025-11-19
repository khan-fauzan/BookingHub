"use client";

import { ArrowUpDown, Check } from "lucide-react";
import { useState } from "react";

export type SortOption =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "distance";

interface SearchSortProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS = [
  { value: "recommended" as SortOption, label: "Recommended" },
  { value: "price_asc" as SortOption, label: "Price: Low to High" },
  { value: "price_desc" as SortOption, label: "Price: High to Low" },
  { value: "rating" as SortOption, label: "Guest Rating" },
  { value: "distance" as SortOption, label: "Distance from Center" },
];

export function SearchSort({ currentSort, onSortChange }: SearchSortProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = SORT_OPTIONS.find(
    (option) => option.value === currentSort
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors bg-white"
      >
        <ArrowUpDown className="h-4 w-4 text-neutral-600" />
        <span className="text-sm font-medium text-neutral-900">
          Sort: {currentOption?.label}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentSort === option.value
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <span>{option.label}</span>
                  {currentSort === option.value && (
                    <Check className="h-4 w-4 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
