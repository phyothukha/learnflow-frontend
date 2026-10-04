"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";

export interface DataTableToolbarProps {
  title?: string;
  selectedCount?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter buttons shown before the search box. */
  filters?: ReactNode;
  /** Shows a reset button; pass only while a filter is active. */
  onResetFilters?: () => void;
}

export function DataTableToolbar({
  title,
  selectedCount = 0,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  onResetFilters,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex min-w-0 items-center gap-2">
        {title ? <p className="truncate font-semibold">{title}</p> : null}
        {selectedCount > 0 && (
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {selectedCount} selected
          </span>
        )}
      </div>
      {(filters || onSearchChange) && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {filters}
          {onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={onResetFilters}
            >
              Reset
              <X className="size-4" />
            </Button>
          )}
          {onSearchChange && (
            <SearchInput
              value={search ?? ""}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="sm:w-64"
            />
          )}
        </div>
      )}
    </div>
  );
}
