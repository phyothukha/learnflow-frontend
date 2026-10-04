"use client";

import type { CSSProperties } from "react";
import { SlidersHorizontal } from "lucide-react";
import { AnimatedTabs, type AnimatedTab } from "@/components/animated-tabs";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ScheduleFilterCategory<C extends string> {
  value: C;
  label: string;
  color: string;
  count: number;
}

export interface ScheduleFiltersProps<S extends string, C extends string> {
  statusTabs: AnimatedTab<S>[];
  status: S;
  onStatusChange: (value: S) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  categoriesLabel?: string;
  categories: ScheduleFilterCategory<C>[];
  hiddenCategories: Set<C>;
  onToggleCategory: (category: C) => void;
  onShowAllCategories: () => void;
}

export function ScheduleFilters<S extends string, C extends string>({
  statusTabs,
  status,
  onStatusChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search",
  categoriesLabel = "Categories",
  categories,
  hiddenCategories,
  onToggleCategory,
  onShowAllCategories,
}: ScheduleFiltersProps<S, C>) {
  const searchField = (
    <SearchInput
      value={search}
      onChange={onSearchChange}
      placeholder={searchPlaceholder}
      className="min-w-0 flex-1 sm:w-56 md:flex-none"
    />
  );
  const chips = (
    <CategoryChips
      categories={categories}
      hiddenCategories={hiddenCategories}
      onToggleCategory={onToggleCategory}
      onShowAllCategories={onShowAllCategories}
    />
  );

  return (
    <div className="shrink-0">
      <div className="flex items-end justify-between gap-x-4 border-b px-2 md:px-4">
        <AnimatedTabs
          tabs={statusTabs}
          value={status}
          onValueChange={onStatusChange}
          className="scrollbar-none -mb-px max-w-full overflow-x-auto border-b-0"
          tabClassName="px-3"
        />
        <div className="my-2 hidden md:flex">{searchField}</div>
      </div>

      <div className="flex items-center gap-2 border-b px-3 py-2 md:hidden">
        {searchField}
        {categories.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="relative shrink-0"
                aria-label={`Filter ${categoriesLabel.toLowerCase()}`}
              >
                <SlidersHorizontal className="size-4" />
                {hiddenCategories.size > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
                    {hiddenCategories.size}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {categoriesLabel}
              </p>
              <div className="flex flex-wrap items-center gap-2">{chips}</div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {categories.length > 0 && (
        <div className="hidden flex-wrap items-center gap-2 border-b px-4 py-2.5 md:flex">
          <span className="mr-1 shrink-0 text-xs font-medium text-muted-foreground">
            {categoriesLabel}
          </span>
          {chips}
        </div>
      )}
    </div>
  );
}

interface CategoryChipsProps<C extends string> {
  categories: ScheduleFilterCategory<C>[];
  hiddenCategories: Set<C>;
  onToggleCategory: (category: C) => void;
  onShowAllCategories: () => void;
}

function CategoryChips<C extends string>({
  categories,
  hiddenCategories,
  onToggleCategory,
  onShowAllCategories,
}: CategoryChipsProps<C>) {
  return (
    <>
      {categories.map(({ value, label, color, count }) => {
        const hidden = hiddenCategories.has(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={!hidden}
            title={hidden ? `Show ${label}` : `Hide ${label}`}
            onClick={() => onToggleCategory(value)}
            style={{ "--task-color": color } as CSSProperties}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all duration-200",
              hidden
                ? "border-dashed text-muted-foreground line-through opacity-60 hover:opacity-100"
                : "task-chip text-(--task-color) hover:shadow-xs",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full bg-(--task-color) transition-opacity",
                hidden && "opacity-40",
              )}
            />
            {label}
            <span className="tabular-nums opacity-70">{count}</span>
          </button>
        );
      })}
      {hiddenCategories.size > 0 && (
        <button
          type="button"
          onClick={onShowAllCategories}
          className="ml-1 shrink-0 text-xs font-medium whitespace-nowrap text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Show all
        </button>
      )}
    </>
  );
}
