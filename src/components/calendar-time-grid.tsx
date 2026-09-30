"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { dayKey, layoutLanes, minutesOfDay } from "@/utils/calendar";
import { formatTimeRange } from "@/utils/format";

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 96;
const MIN_EVENT_HEIGHT = 26;
const GUTTER_WIDTH = 64;
const MOBILE_GUTTER_WIDTH = 48;
const MIN_DAY_COLUMN_WIDTH = 120;
const SNAP_MINUTES = 15;
const DRAG_THRESHOLD = 4;
const AUTO_SCROLL_EDGE = 48;
const AUTO_SCROLL_MAX_SPEED = 14;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);

export interface CalendarEvent {
  Id: string;
  Title: string;
  StartAt: string;
  EndAt: string;
}

export interface CalendarEventRange {
  StartAt: string;
  EndAt: string;
}

export type CalendarPopoverSide = "right" | "bottom";

export interface CalendarEventContentState {
  compact: boolean;
  muted: boolean;
  timeText: string;
}

export interface CalendarEventRenderers<T extends CalendarEvent> {
  getColor: (event: T) => string | undefined;
  /** Faded, e.g. finished items. */
  isMuted?: (event: T) => boolean;
  /** Wraps the event button, usually in a detail popover trigger. */
  renderPopover?: (
    event: T,
    trigger: ReactElement,
    side: CalendarPopoverSide,
  ) => ReactNode;
  onEventChange: (event: T, range: CalendarEventRange) => void;
}

enum DragMode {
  Move = "move",
  Resize = "resize",
}

interface DragState {
  eventId: string;
  mode: DragMode;
  color: string | undefined;
  originX: number;
  originY: number;
  originScroll: number;
  originDay: number;
  originStart: number;
  originEnd: number;
  /** Raw pointer offset in px, so the card follows the cursor without snapping. */
  offsetX: number;
  offsetY: number;
  /** Snapped drop target. */
  day: number;
  start: number;
  end: number;
  moved: boolean;
}

function minuteToOffset(minute: number) {
  return ((minute - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function timeLabel(day: Dayjs, start: number, end: number) {
  const base = day.startOf("day");
  return formatTimeRange(
    base.add(start, "minute").toISOString(),
    base.add(end, "minute").toISOString(),
  );
}

function useNow() {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export interface CalendarTimeGridProps<
  T extends CalendarEvent,
> extends CalendarEventRenderers<T> {
  days: Dayjs[];
  events: T[];
  renderContent?: (event: T, state: CalendarEventContentState) => ReactNode;
  onCreateAt?: (start: Dayjs) => void;
  createHint?: string;
}

export function CalendarTimeGrid<T extends CalendarEvent>({
  days,
  events,
  getColor,
  isMuted,
  renderPopover,
  renderContent,
  onEventChange,
  onCreateAt,
  createHint,
}: CalendarTimeGridProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const suppressClickRef = useRef(false);
  const eventsRef = useRef(events);
  const onEventChangeRef = useRef(onEventChange);
  const [drag, setDrag] = useState<DragState | null>(null);
  const now = useNow();
  const isMobile = useIsMobile();
  const gutterWidth = isMobile ? MOBILE_GUTTER_WIDTH : GUTTER_WIDTH;
  const gridTemplateColumns = `${gutterWidth}px repeat(${days.length}, minmax(0, 1fr))`;
  const eventsByDay = Map.groupBy(events, (event) =>
    dayKey(dayjs(event.StartAt)),
  );

  useEffect(() => {
    eventsRef.current = events;
    onEventChangeRef.current = onEventChange;
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: HOUR_HEIGHT - 8 });
  }, []);

  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    let frame = 0;

    const update = () => {
      const current = dragRef.current;
      const body = bodyRef.current;
      const scroll = scrollRef.current;
      if (!current || !body || !scroll) return;
      const { x, y } = pointerRef.current;
      const rawX = x - current.originX;
      const rawY =
        y - current.originY + scroll.scrollTop - current.originScroll;
      if (!current.moved && Math.hypot(rawX, rawY) < DRAG_THRESHOLD) return;

      const duration = current.originEnd - current.originStart;
      let next: DragState;
      if (current.mode === DragMode.Move) {
        const offsetY = clamp(
          rawY,
          minuteToOffset(START_HOUR * 60) - minuteToOffset(current.originStart),
          minuteToOffset(END_HOUR * 60 - duration) -
            minuteToOffset(current.originStart),
        );
        const delta =
          Math.round((offsetY / HOUR_HEIGHT) * (60 / SNAP_MINUTES)) *
          SNAP_MINUTES;
        const start = clamp(
          current.originStart + delta,
          START_HOUR * 60,
          END_HOUR * 60 - duration,
        );
        const rect = body.getBoundingClientRect();
        const columnWidth = (rect.width - gutterWidth) / days.length;
        const day = clamp(
          Math.floor((x - rect.left - gutterWidth) / columnWidth),
          0,
          days.length - 1,
        );
        next = {
          ...current,
          moved: true,
          offsetX: rawX,
          offsetY,
          day,
          start,
          end: start + duration,
        };
      } else {
        const offsetY = clamp(
          rawY,
          minuteToOffset(current.originStart + SNAP_MINUTES) -
            minuteToOffset(current.originEnd),
          minuteToOffset(END_HOUR * 60) - minuteToOffset(current.originEnd),
        );
        const delta =
          Math.round((offsetY / HOUR_HEIGHT) * (60 / SNAP_MINUTES)) *
          SNAP_MINUTES;
        next = {
          ...current,
          moved: true,
          offsetY,
          end: clamp(
            current.originEnd + delta,
            current.originStart + SNAP_MINUTES,
            END_HOUR * 60,
          ),
        };
      }
      dragRef.current = next;
      setDrag(next);
    };

    // Keeps scrolling while the pointer rests near an edge, easing in with proximity.
    const autoScroll = () => {
      const scroll = scrollRef.current;
      if (scroll && dragRef.current?.moved) {
        const bounds = scroll.getBoundingClientRect();
        const { y } = pointerRef.current;
        const topGap = y - bounds.top;
        const bottomGap = bounds.bottom - y;
        let speed = 0;
        if (topGap < AUTO_SCROLL_EDGE)
          speed =
            -AUTO_SCROLL_MAX_SPEED *
            (1 - Math.max(topGap, 0) / AUTO_SCROLL_EDGE);
        else if (bottomGap < AUTO_SCROLL_EDGE)
          speed =
            AUTO_SCROLL_MAX_SPEED *
            (1 - Math.max(bottomGap, 0) / AUTO_SCROLL_EDGE);
        if (speed !== 0) {
          scroll.scrollTop += speed;
          update();
        }
      }
      frame = requestAnimationFrame(autoScroll);
    };
    frame = requestAnimationFrame(autoScroll);

    const handleMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      update();
    };

    const handleUp = () => {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!current?.moved) return;

      suppressClickRef.current = true;
      setTimeout(() => (suppressClickRef.current = false), 0);
      const unchanged =
        current.day === current.originDay &&
        current.start === current.originStart &&
        current.end === current.originEnd;
      const event = eventsRef.current.find((e) => e.Id === current.eventId);
      if (unchanged || !event) return;

      const base = days[current.day].startOf("day");
      onEventChangeRef.current(event, {
        StartAt: base.add(current.start, "minute").toISOString(),
        EndAt: base.add(current.end, "minute").toISOString(),
      });
    };

    const handleCancel = () => {
      dragRef.current = null;
      setDrag(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
    };
  }, [dragging, days, gutterWidth]);

  const startDrag = (e: ReactPointerEvent, event: T, mode: DragMode) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const start = minutesOfDay(dayjs(event.StartAt));
    const end = start + dayjs(event.EndAt).diff(event.StartAt, "minute");
    const day = days.findIndex((d) => d.isSame(event.StartAt, "day"));
    pointerRef.current = { x: e.clientX, y: e.clientY };
    const next: DragState = {
      eventId: event.Id,
      mode,
      color: getColor(event),
      originX: e.clientX,
      originY: e.clientY,
      originScroll: scrollRef.current?.scrollTop ?? 0,
      originDay: day,
      originStart: start,
      originEnd: end,
      offsetX: 0,
      offsetY: 0,
      day,
      start,
      end,
      moved: false,
    };
    dragRef.current = next;
    setDrag(next);
  };

  const activeDrag = drag?.moved ? drag : null;

  return (
    <div
      ref={scrollRef}
      className={cn(
        "scrollbar-handle min-h-0 flex-1 overflow-auto",
        activeDrag &&
          (activeDrag.mode === DragMode.Move
            ? "cursor-grabbing select-none"
            : "cursor-ns-resize select-none"),
      )}
    >
      <div
        style={{
          minWidth:
            days.length > 1
              ? gutterWidth + days.length * MIN_DAY_COLUMN_WIDTH
              : undefined,
        }}
      >
        <div
          className={cn(
            "sticky top-0 z-40 grid border-b bg-card",
            isMobile && days.length === 1 && "hidden",
          )}
          style={{ gridTemplateColumns }}
        >
          <div />
          {days.map((day, index) => {
            const isToday = day.isSame(now, "day");
            const isTarget =
              activeDrag?.mode === DragMode.Move && activeDrag.day === index;
            return (
              <div
                key={dayKey(day)}
                className={cn(
                  "flex items-center justify-center gap-1.5 border-l py-3 text-sm transition-colors duration-150",
                  isTarget && "bg-primary/5",
                )}
              >
                <span className="text-muted-foreground">
                  {day.format("ddd")}
                </span>
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full font-semibold tabular-nums",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {day.format("DD")}
                </span>
              </div>
            );
          })}
        </div>

        <div
          ref={bodyRef}
          className="relative grid"
          style={{
            gridTemplateColumns,
            height: HOURS.length * HOUR_HEIGHT,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0"
            style={{ left: gutterWidth }}
          >
            {HOURS.map((hour, i) => (
              <div key={hour}>
                <div
                  className="absolute inset-x-0 border-t"
                  style={{ top: i * HOUR_HEIGHT }}
                />
                <div
                  className="absolute inset-x-0 border-t border-dashed border-border/60"
                  style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                />
              </div>
            ))}
          </div>

          <div className="relative">
            {HOURS.map((hour, i) => (
              <span
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[10px] sm:right-3 sm:text-[11px] whitespace-nowrap text-muted-foreground tabular-nums first:translate-y-1"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {dayjs().hour(hour).format("h A")}
              </span>
            ))}
          </div>

          {days.map((day, index) => (
            <DayColumn
              key={dayKey(day)}
              day={day}
              events={eventsByDay.get(dayKey(day)) ?? []}
              nowMinute={day.isSame(now, "day") ? minutesOfDay(now) : null}
              popoverSide={days.length > 1 ? "right" : "bottom"}
              drag={activeDrag}
              isDropTarget={
                activeDrag?.mode === DragMode.Move && activeDrag.day === index
              }
              getColor={getColor}
              isMuted={isMuted}
              renderPopover={renderPopover}
              renderContent={renderContent}
              onStartDrag={startDrag}
              onCreateAt={
                onCreateAt &&
                ((minute) =>
                  onCreateAt(day.startOf("day").add(minute, "minute")))
              }
              createHint={createHint}
              shouldSuppressClick={() => suppressClickRef.current}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DayColumnProps<T extends CalendarEvent> extends Omit<
  CalendarEventRenderers<T>,
  "onEventChange"
> {
  day: Dayjs;
  events: T[];
  nowMinute: number | null;
  popoverSide: CalendarPopoverSide;
  drag: DragState | null;
  isDropTarget: boolean;
  renderContent?: (event: T, state: CalendarEventContentState) => ReactNode;
  onStartDrag: (e: ReactPointerEvent, event: T, mode: DragMode) => void;
  onCreateAt?: (minute: number) => void;
  createHint?: string;
  shouldSuppressClick: () => boolean;
}

function DayColumn<T extends CalendarEvent>({
  day,
  events,
  nowMinute,
  popoverSide,
  drag,
  isDropTarget,
  getColor,
  isMuted,
  renderPopover,
  renderContent,
  onStartDrag,
  onCreateAt,
  createHint,
  shouldSuppressClick,
}: DayColumnProps<T>) {
  const visible = events.flatMap((event) => {
    const eventStart = minutesOfDay(dayjs(event.StartAt));
    const start = Math.max(eventStart, START_HOUR * 60);
    const end = Math.min(
      eventStart + dayjs(event.EndAt).diff(event.StartAt, "minute"),
      END_HOUR * 60,
    );
    return end > start ? [{ event, start, end }] : [];
  });
  const layout = layoutLanes(visible, ({ start, end }) => ({ start, end }));
  const showNow =
    nowMinute !== null &&
    nowMinute >= START_HOUR * 60 &&
    nowMinute <= END_HOUR * 60;

  return (
    <div
      className={cn(
        "relative border-l transition-colors duration-150",
        isDropTarget && "bg-primary/[0.03]",
      )}
      title={onCreateAt ? createHint : undefined}
      onClick={(e) => {
        if (!onCreateAt) return;
        if (e.target !== e.currentTarget || shouldSuppressClick()) return;
        const offset = e.nativeEvent.offsetY;
        const minute =
          START_HOUR * 60 + Math.floor((offset / HOUR_HEIGHT) * 2) * 30;
        onCreateAt(Math.min(minute, END_HOUR * 60 - 60));
      }}
    >
      {isDropTarget && drag && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 z-10 flex items-start rounded-md border-2 border-dashed px-2 py-1 text-[11px] font-semibold tabular-nums transition-[top,height] duration-100 ease-out"
          style={{
            top: minuteToOffset(drag.start),
            height: minuteToOffset(drag.end) - minuteToOffset(drag.start),
            borderColor: drag.color,
            color: drag.color,
            backgroundColor: `color-mix(in srgb, ${drag.color} 10%, transparent)`,
          }}
        >
          {timeLabel(day, drag.start, drag.end)}
        </div>
      )}

      {layout.map(({ item, lane, lanes }) => {
        const top = minuteToOffset(item.start);
        const height = Math.max(
          minuteToOffset(item.end) - top,
          MIN_EVENT_HEIGHT,
        );
        const isDragging = drag?.eventId === item.event.Id;
        const isResizing = isDragging && drag.mode === DragMode.Resize;
        const isMoving = isDragging && drag.mode === DragMode.Move;
        const compact = height < 44;
        const muted = isMuted?.(item.event) ?? false;
        const timeText = isResizing
          ? timeLabel(day, drag.start, drag.end)
          : formatTimeRange(item.event.StartAt, item.event.EndAt);
        const trigger = (
          <button
            type="button"
            title={item.event.Title}
            onPointerDown={(e) => onStartDrag(e, item.event, DragMode.Move)}
            onClick={(e) => {
              if (shouldSuppressClick()) e.preventDefault();
            }}
            style={{ "--task-color": getColor(item.event) } as CSSProperties}
            className={cn(
              "task-chip flex size-full min-w-0 cursor-grab touch-none flex-col gap-1 overflow-hidden rounded-md border px-2 text-left shadow-xs transition-[box-shadow,transform,opacity] duration-150 select-none hover:shadow-md data-[state=open]:border-l-4 data-[state=open]:border-l-(--task-color) data-[state=open]:shadow-md",
              compact ? "justify-center py-0.5" : "py-1.5",
              muted && "opacity-60",
              isDragging &&
                "scale-[1.02] cursor-grabbing opacity-95 shadow-xl ring-2 ring-(--task-color)",
            )}
          >
            {renderContent ? (
              renderContent(item.event, { compact, muted, timeText })
            ) : (
              <CalendarEventContent
                title={item.event.Title}
                compact={compact}
                muted={muted}
                timeText={timeText}
              />
            )}
          </button>
        );
        return (
          <div
            key={item.event.Id}
            className={cn(
              "group absolute px-1 py-0.5",
              isDragging && "z-30 will-change-transform",
            )}
            style={{
              top,
              height: isResizing
                ? Math.max(height + drag.offsetY, MIN_EVENT_HEIGHT)
                : height,
              left: `${(lane / lanes) * 100}%`,
              width: `${100 / lanes}%`,
              transform: isMoving
                ? `translate3d(${drag.offsetX}px, ${drag.offsetY}px, 0)`
                : undefined,
            }}
          >
            {renderPopover
              ? renderPopover(item.event, trigger, popoverSide)
              : trigger}
            <div
              aria-hidden
              onPointerDown={(e) => onStartDrag(e, item.event, DragMode.Resize)}
              className={cn(
                "absolute inset-x-2 bottom-0 flex h-2.5 cursor-ns-resize touch-none items-center justify-center opacity-0 transition-opacity group-hover:opacity-100",
                isResizing && "opacity-100",
              )}
            >
              <span className="h-1 w-6 rounded-full bg-foreground/30" />
            </div>
          </div>
        );
      })}

      {showNow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-primary"
          style={{ top: minuteToOffset(nowMinute) }}
        >
          <span className="absolute -top-[5px] -left-[5px] size-2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}

export interface CalendarEventContentProps extends CalendarEventContentState {
  title: string;
  /** Shown before the title when there is room, e.g. an avatar. */
  leading?: ReactNode;
  /** Replaces the time line when there is room. */
  subtitle?: ReactNode;
}

export function CalendarEventContent({
  title,
  compact,
  muted,
  timeText,
  leading,
  subtitle,
}: CalendarEventContentProps) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-1.5">
        {!compact && leading}
        <span
          className={cn(
            "truncate text-xs font-medium",
            muted && "line-through",
          )}
        >
          {title}
        </span>
      </span>
      {!compact && (
        <span className="truncate text-[11px] font-medium text-(--task-color) tabular-nums">
          {timeText}
        </span>
      )}
      {!compact && subtitle}
    </>
  );
}
