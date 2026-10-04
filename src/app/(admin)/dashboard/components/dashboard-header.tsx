"use client";

import { useState } from "react";
import dayjs from "dayjs";
import type { DateRange } from "react-day-picker";
import { CalendarDays, ChevronDown, Download, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DASHBOARD_PERIOD_DAYS,
  DASHBOARD_PERIOD_LABELS,
  DASHBOARD_WIDGET_LABELS,
  DashboardPeriod,
  type DashboardWidget,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export interface DashboardRange {
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
}

export interface DashboardHeaderProps {
  period: DashboardPeriod;
  range: DashboardRange;
  rangeLabel: string;
  hiddenWidgets: string[];
  onPeriodChange: (period: DashboardPeriod) => void;
  onRangeChange: (range: DashboardRange) => void;
  onToggleWidget: (widget: DashboardWidget) => void;
  onShowAllWidgets: () => void;
  onExport: () => void;
  className?: string;
}

interface RangePickerProps {
  range: DashboardRange;
  rangeLabel: string;
  onRangeChange: (range: DashboardRange) => void;
}

function RangePicker({ range, rangeLabel, onRangeChange }: RangePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) setDraft({ from: range.from.toDate(), to: range.to.toDate() });
  }

  function apply() {
    if (!draft?.from) return;
    onRangeChange({
      from: dayjs(draft.from).startOf("day"),
      to: dayjs(draft.to ?? draft.from).endOf("day"),
    });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="dashboard-chip"
          aria-label="Date range"
        >
          <CalendarDays className="size-4" />
          <span className="hidden sm:inline">{rangeLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          numberOfMonths={isMobile ? 1 : 2}
          selected={draft}
          defaultMonth={dayjs(range.to)
            .subtract(isMobile ? 0 : 1, "month")
            .toDate()}
          disabled={{ after: new Date() }}
          onSelect={setDraft}
        />
        <div className="flex items-center justify-between gap-2 border-t p-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {draft?.from
              ? `${dayjs(draft.from).format("MMM D")} – ${dayjs(draft.to ?? draft.from).format("MMM D, YYYY")}`
              : "Pick a start date"}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!draft?.from} onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DashboardHeader({
  period,
  range,
  rangeLabel,
  hiddenWidgets,
  onPeriodChange,
  onRangeChange,
  onToggleWidget,
  onShowAllWidgets,
  onExport,
  className,
}: DashboardHeaderProps) {
  const hidden = new Set(hiddenWidgets);

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
        <RangePicker
          range={range}
          rangeLabel={rangeLabel}
          onRangeChange={onRangeChange}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="dashboard-chip">
              {DASHBOARD_PERIOD_LABELS.get(period)}
              <ChevronDown className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuRadioGroup
              value={period}
              onValueChange={(value) =>
                onPeriodChange(value as DashboardPeriod)
              }
            >
              {Array.from(DASHBOARD_PERIOD_DAYS.keys(), (value) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {DASHBOARD_PERIOD_LABELS.get(value)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <LayoutGrid />
              Widgets
              {hidden.size > 0 && (
                <span className="rounded-sm bg-foreground/10 px-1 text-xs tabular-nums">
                  {DASHBOARD_WIDGET_LABELS.size - hidden.size}/
                  {DASHBOARD_WIDGET_LABELS.size}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Show on dashboard</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Array.from(DASHBOARD_WIDGET_LABELS, ([widget, label]) => (
              <DropdownMenuCheckboxItem
                key={widget}
                checked={!hidden.has(widget)}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={() => onToggleWidget(widget)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={hidden.size === 0}
              onSelect={onShowAllWidgets}
            >
              Show all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={onExport}>
          <Download />
          Export
        </Button>
      </div>
    </div>
  );
}
