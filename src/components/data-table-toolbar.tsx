"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface DataTableToolbarProps {
  title?: string;
  selectedCount?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function DataTableToolbar({
  title,
  selectedCount = 0,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
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
      {onSearchChange && (
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-full pl-9"
          />
        </div>
      )}
    </div>
  );
}
