"use client";

import { useState, type CSSProperties } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { cn } from "@/lib/utils";
import { dayKey, monthGridDays } from "@/utils/calendar";
import type {
  CalendarEvent,
  CalendarEventRenderers,
} from "./calendar-time-grid";

const MAX_VISIBLE = 3;
const MOBILE_MAX_DOTS = 6;
const EVENT_DRAG_TYPE = "application/x-calendar-event-id";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface CalendarMonthGridProps<
  T extends CalendarEvent,
> extends CalendarEventRenderers<T> {
  month: Dayjs;
  events: T[];
  onSelectDay: (day: Dayjs) => void;
}

export function CalendarMonthGrid<T extends CalendarEvent>({
  month,
  events,
  getColor,
  isMuted,
  renderPopover,
  onEventChange,
  onSelectDay,
}: CalendarMonthGridProps<T>) {
  const [dropKey, setDropKey] = useState<string | null>(null);
  const days = monthGridDays(month);
  const today = dayjs();
  const eventsByDay = Map.groupBy(
    [...events].sort((a, b) => a.StartAt.localeCompare(b.StartAt)),
    (event) => dayKey(dayjs(event.StartAt)),
  );

  const moveToDay = (id: string, day: Dayjs) => {
    const event = events.find((e) => e.Id === id);
    if (!event) return;
    const start = dayjs(event.StartAt);
    if (start.isSame(day, "day")) return;
    const nextStart = day.hour(start.hour()).minute(start.minute());
    onEventChange(event, {
      StartAt: nextStart.toISOString(),
      EndAt: nextStart
        .add(dayjs(event.EndAt).diff(start, "minute"), "minute")
        .toISOString(),
    });
  };

  return (
    <div className="scrollbar-handle min-h-0 flex-1 overflow-auto">
      <div className="flex h-full flex-col md:min-w-[760px]">
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="border-l py-2.5 text-center text-xs font-medium text-muted-foreground first:border-l-0"
            >
              <span className="md:hidden">{weekday.charAt(0)}</span>
              <span className="hidden md:inline">{weekday}</span>
            </div>
          ))}
        </div>
        <div className="grid flex-1 auto-rows-fr grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsByDay.get(dayKey(day)) ?? [];
            const hidden = dayEvents.length - MAX_VISIBLE;
            const inMonth = day.isSame(month, "month");
            return (
              <div
                key={dayKey(day)}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes(EVENT_DRAG_TYPE)) return;
                  e.preventDefault();
                  setDropKey(dayKey(day));
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node))
                    setDropKey(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropKey(null);
                  const id = e.dataTransfer.getData(EVENT_DRAG_TYPE);
                  if (id) moveToDay(id, day);
                }}
                className={cn(
                  "flex min-h-16 min-w-0 flex-col gap-1 border-b border-l p-1 transition-colors md:min-h-28 md:p-1.5 [&:nth-child(7n+1)]:border-l-0",
                  !inMonth && "bg-muted/30",
                  dropKey === dayKey(day) && "bg-primary/10",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={cn(
                    "inline-flex size-6 items-center justify-center self-center rounded-full text-xs font-medium tabular-nums hover:bg-muted md:self-end",
                    !inMonth && "text-muted-foreground/60",
                    day.isSame(today, "day") &&
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {day.date()}
                </button>
                {dayEvents.length > 0 && (
                  <button
                    type="button"
                    aria-label={`${dayEvents.length} on ${day.format("DD MMM")}`}
                    onClick={() => onSelectDay(day)}
                    className="flex flex-1 flex-wrap content-start justify-center gap-1 md:hidden"
                  >
                    {dayEvents.slice(0, MOBILE_MAX_DOTS).map((event) => (
                      <span
                        key={event.Id}
                        className={cn(
                          "size-1.5 rounded-full",
                          isMuted?.(event) && "opacity-40",
                        )}
                        style={{ backgroundColor: getColor(event) }}
                      />
                    ))}
                    {dayEvents.length > MOBILE_MAX_DOTS && (
                      <span className="w-full text-center text-[10px] leading-none text-muted-foreground">
                        +{dayEvents.length - MOBILE_MAX_DOTS}
                      </span>
                    )}
                  </button>
                )}
                {dayEvents.slice(0, MAX_VISIBLE).map((event) => {
                  const chip = (
                    <button
                      type="button"
                      title={event.Title}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(EVENT_DRAG_TYPE, event.Id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      style={
                        { "--task-color": getColor(event) } as CSSProperties
                      }
                      className={cn(
                        "task-chip flex min-w-0 cursor-grab items-center gap-1.5 rounded border px-1.5 py-0.5 text-left text-[11px] active:cursor-grabbing data-[state=open]:ring-1 data-[state=open]:ring-(--task-color)",
                        isMuted?.(event) && "opacity-60",
                      )}
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-(--task-color)" />
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {dayjs(event.StartAt).format("h:mm A")}
                      </span>
                      <span className="truncate font-medium">
                        {event.Title}
                      </span>
                    </button>
                  );
                  return (
                    <div
                      key={event.Id}
                      className="hidden min-w-0 flex-col md:flex"
                    >
                      {renderPopover
                        ? renderPopover(event, chip, "bottom")
                        : chip}
                    </div>
                  );
                })}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className="hidden rounded px-1.5 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground md:block"
                  >
                    +{hidden} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
