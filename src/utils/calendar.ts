import type { Dayjs } from "dayjs";

export enum CalendarMode {
  Day = "day",
  Week = "week",
  Month = "month",
}

export interface CalendarRange {
  start: Dayjs;
  /** Exclusive. */
  end: Dayjs;
}

/** Monday-based start of the week. */
export function startOfWeek(date: Dayjs): Dayjs {
  return date.startOf("day").subtract((date.day() + 6) % 7, "day");
}

export function weekDays(date: Dayjs): Dayjs[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => start.add(i, "day"));
}

/** Every day shown in a month view: full Monday–Sunday weeks covering the month. */
export function monthGridDays(date: Dayjs): Dayjs[] {
  const start = startOfWeek(date.startOf("month"));
  const end = startOfWeek(date.endOf("month")).add(6, "day");
  return Array.from({ length: end.diff(start, "day") + 1 }, (_, i) =>
    start.add(i, "day"),
  );
}

/** The days a calendar view covers, e.g. the full visible grid in month mode. */
export function calendarRange(
  cursor: Dayjs,
  mode: CalendarMode,
): CalendarRange {
  if (mode === CalendarMode.Day)
    return {
      start: cursor.startOf("day"),
      end: cursor.startOf("day").add(1, "day"),
    };
  if (mode === CalendarMode.Week) {
    const start = startOfWeek(cursor);
    return { start, end: start.add(7, "day") };
  }
  const days = monthGridDays(cursor);
  return { start: days[0], end: days[days.length - 1].add(1, "day") };
}

export function minutesOfDay(date: Dayjs): number {
  return date.hour() * 60 + date.minute();
}

export function dayKey(date: Dayjs): string {
  return date.format("YYYY-MM-DD");
}

export interface MinuteRange {
  start: number;
  end: number;
}

export interface LaneLayout<T> {
  item: T;
  lane: number;
  lanes: number;
}

/**
 * Places overlapping items side by side. Items in the same overlap cluster
 * share a lane count so their widths line up.
 */
export function layoutLanes<T>(
  items: T[],
  range: (item: T) => MinuteRange,
): LaneLayout<T>[] {
  const sorted = items
    .map((item) => ({ item, ...range(item) }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const result: LaneLayout<T>[] = [];
  let cluster: LaneLayout<T>[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    for (const entry of cluster) entry.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };

  for (const { item, start, end } of sorted) {
    if (start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) lane = laneEnds.push(end) - 1;
    else laneEnds[lane] = end;
    const entry = { item, lane, lanes: 1 };
    cluster.push(entry);
    result.push(entry);
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();

  return result;
}
