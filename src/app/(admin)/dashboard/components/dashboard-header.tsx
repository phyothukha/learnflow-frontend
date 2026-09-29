"use client";

import { CalendarDays, ChevronDown, Download, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DashboardHeaderProps {
  rangeLabel: string;
  periodLabel?: string;
  className?: string;
}

export function DashboardHeader({
  rangeLabel,
  periodLabel = "Last 30 days",
  className,
}: DashboardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your focus time, study sessions and document progress at a glance
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <CalendarDays className="size-4" />
          <span className="hidden sm:inline">{rangeLabel}</span>
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {periodLabel}
          <ChevronDown className="size-4" />
        </button>
        <Button variant="soft" size="sm" className="h-9">
          <LayoutGrid className="size-4" />
          Add widget
        </Button>
        <Button variant="secondary" size="sm" className="h-9">
          <Download className="size-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
