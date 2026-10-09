import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/** e.g. "08:00 AM - 08:30 AM" */
export function formatTimeRange(start: string, end: string) {
  return `${dayjs(start).format("hh:mm A")} - ${dayjs(end).format("hh:mm A")}`;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatHours(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** e.g. "3 days ago" */
export function formatRelative(date: string) {
  return dayjs(date).fromNow();
}
