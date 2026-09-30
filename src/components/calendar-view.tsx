"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatedTabs,
  AnimatedTabsVariant,
  type AnimatedTab,
} from "@/components/animated-tabs";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalendarMode, startOfWeek, weekDays } from "@/utils/calendar";
import { CalendarMonthGrid } from "./calendar-month-grid";
import {
  CalendarTimeGrid,
  type CalendarEvent,
  type CalendarTimeGridProps,
} from "./calendar-time-grid";

const CALENDAR_MODES: AnimatedTab<CalendarMode>[] = [
  { value: CalendarMode.Day, label: "Day" },
  { value: CalendarMode.Week, label: "Week" },
  { value: CalendarMode.Month, label: "Month" },
].map(({ value, label }) => ({
  value,
  title: label,
  label: (
    <>
      <span className="md:hidden">{label.charAt(0)}</span>
      <span className="hidden md:inline">{label}</span>
    </>
  ),
}));

function formatRange(cursor: Dayjs, mode: CalendarMode) {
  if (mode === CalendarMode.Day) return cursor.format("ddd, DD MMM YYYY");
  const start =
    mode === CalendarMode.Week ? startOfWeek(cursor) : cursor.startOf("month");
  const end =
    mode === CalendarMode.Week ? start.add(6, "day") : cursor.endOf("month");
  return `${start.format("DD MMM")} - ${end.format("DD MMM YYYY")}`;
}

export interface CalendarViewProps<T extends CalendarEvent> extends Omit<
  CalendarTimeGridProps<T>,
  "days"
> {
  mode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
  cursor: Dayjs;
  onCursorChange: (cursor: Dayjs) => void;
  /** Rendered next to the month title, e.g. a loading indicator. */
  status?: ReactNode;
}

export function CalendarView<T extends CalendarEvent>({
  mode,
  onModeChange,
  cursor,
  onCursorChange,
  status,
  ...gridProps
}: CalendarViewProps<T>) {
  const isMobile = useIsMobile();
  const modeRef = useRef({ mode, onModeChange });
  const gridDays = useMemo(
    () => (mode === CalendarMode.Week ? weekDays(cursor) : [cursor]),
    [mode, cursor],
  );

  useEffect(() => {
    modeRef.current = { mode, onModeChange };
  });

  // Seven columns don't fit a phone, so entering mobile width falls back to one day.
  useEffect(() => {
    const current = modeRef.current;
    if (isMobile && current.mode === CalendarMode.Week)
      current.onModeChange(CalendarMode.Day);
  }, [isMobile]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2 md:flex-wrap md:gap-3 md:px-4 md:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold md:text-base">
            {cursor.format(
              !isMobile
                ? "MMMM YYYY"
                : mode === CalendarMode.Day
                  ? "ddd, D MMM"
                  : "MMM YYYY",
            )}
          </h2>
          {status}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:flex-wrap md:gap-2">
          <AnimatedTabs
            tabs={CALENDAR_MODES}
            value={mode}
            onValueChange={onModeChange}
            variant={AnimatedTabsVariant.Pill}
            tabClassName="px-2.5 py-1 text-xs md:px-3"
          />
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Previous"
              onClick={() => onCursorChange(cursor.subtract(1, mode))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs md:px-3.5 md:text-sm"
              onClick={() => onCursorChange(dayjs().startOf("day"))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Next"
              onClick={() => onCursorChange(cursor.add(1, mode))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <span className="hidden h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium tabular-nums md:inline-flex">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            {formatRange(cursor, mode)}
          </span>
        </div>
      </div>

      {mode === CalendarMode.Month ? (
        <CalendarMonthGrid
          month={cursor}
          events={gridProps.events}
          getColor={gridProps.getColor}
          isMuted={gridProps.isMuted}
          renderPopover={gridProps.renderPopover}
          onEventChange={gridProps.onEventChange}
          onSelectDay={(day) => {
            onCursorChange(day);
            onModeChange(CalendarMode.Day);
          }}
        />
      ) : (
        <CalendarTimeGrid key={mode} days={gridDays} {...gridProps} />
      )}
    </div>
  );
}
