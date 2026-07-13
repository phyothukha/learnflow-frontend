import dayjs from "dayjs";
import type { StudyBlock } from "@/store/server/study-blocks/interface";

export const NO_TOPIC_LABEL = "No topic";

export const chartTooltipStyle: React.CSSProperties = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

export function blockMinutes(block: StudyBlock) {
  return Math.max(0, dayjs(block.EndAt).diff(dayjs(block.StartAt), "minute"));
}

export function formatHours(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
