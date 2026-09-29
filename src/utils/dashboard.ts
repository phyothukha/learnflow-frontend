import dayjs from "dayjs";
import {
  CheckCircle2,
  FileText,
  Flame,
  MousePointerClick,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { DocumentStatus } from "@/store/server/documents/interface";
import {
  StudyBlockStatus,
  type StudyBlock,
} from "@/store/server/study-blocks/interface";
import type { Topic } from "@/store/server/topics/interface";
import type { Note } from "@/store/server/notes/interface";
import { FALLBACK_TOPIC_COLOR } from "@/utils/colors";
import { formatHours } from "@/utils/format";

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

export function formatDashboardRange(from: dayjs.Dayjs, to: dayjs.Dayjs) {
  return `${from.format("MMM D, YYYY")} - ${to.format("MMM D, YYYY")}`;
}

export interface TopicDocument {
  TopicId: string;
  Status: DocumentStatus;
}

export interface TopicDonutSlice {
  name: string;
  color: string;
  minutes: number;
}

export interface TopicProgress extends Topic {
  total: number;
  percent: number;
}

export function sumMinutes(blocks: StudyBlock[] = []) {
  return blocks.reduce((sum, block) => sum + blockMinutes(block), 0);
}

export function buildTopicDonut(
  doneBlocks: StudyBlock[],
  topics: Topic[],
): TopicDonutSlice[] {
  const blocksByTopic = Map.groupBy(doneBlocks, (b) => b.TopicId || null);
  return [
    ...topics.map((topic) => ({
      name: topic.Title,
      color: topic.Color ?? FALLBACK_TOPIC_COLOR,
      minutes: sumMinutes(blocksByTopic.get(topic.Id)),
    })),
    {
      name: NO_TOPIC_LABEL,
      color: FALLBACK_TOPIC_COLOR,
      minutes: sumMinutes(blocksByTopic.get(null)),
    },
  ].filter((slice) => slice.minutes > 0);
}

export function buildTopicProgress(
  documents: TopicDocument[],
  topics: Topic[],
): TopicProgress[] {
  const docsByTopic = Map.groupBy(documents, (d) => d.TopicId);
  return topics
    .map((topic) => {
      const docs = docsByTopic.get(topic.Id) ?? [];
      const done = docs.filter(
        (d) => d.Status === DocumentStatus.Completed,
      ).length;
      return {
        ...topic,
        total: docs.length,
        percent: docs.length ? Math.round((done / docs.length) * 100) : 0,
      };
    })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);
}

export interface TopicSeries {
  key: string;
  color: string;
}

export interface WeeklyFocusRow {
  [key: string]: number | string;
}

export function buildTopicSeries(
  weekBlocks: StudyBlock[],
  topics: Topic[],
): TopicSeries[] {
  const doneTopicIds = new Set(
    weekBlocks
      .filter((b) => b.Status === StudyBlockStatus.Done)
      .map((b) => b.TopicId || null),
  );
  const series = topics
    .filter((t) => doneTopicIds.has(t.Id))
    .map((t) => ({ key: t.Title, color: t.Color ?? FALLBACK_TOPIC_COLOR }));
  if (doneTopicIds.has(null))
    series.push({ key: NO_TOPIC_LABEL, color: FALLBACK_TOPIC_COLOR });
  return series;
}

export function buildWeeklyFocusData(
  weekBlocks: StudyBlock[],
  topics: Topic[],
): WeeklyFocusRow[] {
  const weekStart = dayjs().startOf("week");
  const topicTitleById = new Map(topics.map((t) => [t.Id, t.Title]));
  const blocksByDay = Map.groupBy(
    weekBlocks.filter((b) => b.Status === StudyBlockStatus.Done),
    (b) => dayjs(b.StartAt).format("YYYY-MM-DD"),
  );

  return Array.from({ length: 7 }, (_, i) => {
    const day = weekStart.add(i, "day");
    const row: WeeklyFocusRow = { day: day.format("ddd") };
    for (const block of blocksByDay.get(day.format("YYYY-MM-DD")) ?? []) {
      const key =
        (block.TopicId && topicTitleById.get(block.TopicId)) || NO_TOPIC_LABEL;
      row[key] = ((row[key] as number) ?? 0) + blockMinutes(block);
    }
    return row;
  });
}

export interface FocusPoint {
  label: string;
  current: number;
  previous: number;
}

export interface DayActivePoint {
  day: string;
  minutes: number;
}

export interface TopicSegment {
  name: string;
  count: number;
  color: string;
}

const DAY_KEY = "YYYY-MM-DD";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function donePercent(blocks: StudyBlock[]) {
  if (!blocks.length) return null;
  const done = blocks.filter((b) => b.Status === StudyBlockStatus.Done).length;
  return Math.round((done / blocks.length) * 100);
}

export function calcStreak(doneBlocks: StudyBlock[], maxDays = 30) {
  const doneDays = new Set(
    doneBlocks.map((b) => dayjs(b.StartAt).format(DAY_KEY)),
  );
  let streak = 0;
  for (let i = 0; i < maxDays; i++) {
    const day = dayjs().startOf("day").subtract(i, "day").format(DAY_KEY);
    if (doneDays.has(day)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function minutesByDay(blocks: StudyBlock[]) {
  const grouped = Map.groupBy(blocks, (b) => dayjs(b.StartAt).format(DAY_KEY));
  return new Map(
    Array.from(grouped, ([day, dayBlocks]) => [day, sumMinutes(dayBlocks)]),
  );
}

export function buildFocusSeries(
  doneBlocks: StudyBlock[],
  prevDoneBlocks: StudyBlock[],
  rangeStart: dayjs.Dayjs,
  prevStart: dayjs.Dayjs,
  days = 30,
): FocusPoint[] {
  const current = minutesByDay(doneBlocks);
  const previous = minutesByDay(prevDoneBlocks);
  return Array.from({ length: days }, (_, i) => {
    const day = rangeStart.add(i, "day");
    return {
      label: day.format("MMM D"),
      current: current.get(day.format(DAY_KEY)) ?? 0,
      previous: previous.get(prevStart.add(i, "day").format(DAY_KEY)) ?? 0,
    };
  });
}

export function buildWeekdayData(doneBlocks: StudyBlock[]): DayActivePoint[] {
  const blocksByWeekday = Map.groupBy(doneBlocks, (b): number =>
    dayjs(b.StartAt).day(),
  );
  return WEEKDAYS.map((day, index) => ({
    day,
    minutes: sumMinutes(blocksByWeekday.get(index)),
  }));
}

export function buildTopicSegments(
  documents: TopicDocument[],
  topics: Topic[],
  limit = 3,
): TopicSegment[] {
  const docsByTopic = Map.groupBy(documents, (d) => d.TopicId);
  const segments = topics
    .map((topic) => ({
      name: topic.Title,
      count: docsByTopic.get(topic.Id)?.length ?? 0,
      color: topic.Color ?? FALLBACK_TOPIC_COLOR,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  if (segments.length > 0) return segments;
  return topics.slice(0, limit).map((topic) => ({
    name: topic.Title,
    count: 1,
    color: topic.Color ?? FALLBACK_TOPIC_COLOR,
  }));
}

export function buildNotePreview(note: Note | undefined, length = 180) {
  if (!note) return null;
  return (
    note.Content?.replace(/[#>*_`\-\[\]]/g, "")
      .trim()
      .slice(0, length) || note.Title
  );
}

export interface KpiTile {
  title: string;
  value: string;
  change: number | null;
  icon: LucideIcon;
}

export interface KpiTilesInput {
  focusMinutes: number;
  prevFocusMinutes: number;
  documentCount: number;
  sessions: number;
  prevSessions: number;
  adherence: number | null;
  prevAdherence: number | null;
  streak: number;
}

export function buildKpiTiles({
  focusMinutes,
  prevFocusMinutes,
  documentCount,
  sessions,
  prevSessions,
  adherence,
  prevAdherence,
  streak,
}: KpiTilesInput): KpiTile[] {
  return [
    {
      title: "Focus time",
      value: formatHours(focusMinutes),
      change: percentChange(focusMinutes, prevFocusMinutes),
      icon: Timer,
    },
    {
      title: "Documents",
      value: documentCount.toLocaleString(),
      change: null,
      icon: FileText,
    },
    {
      title: "Study sessions",
      value: sessions.toLocaleString(),
      change: percentChange(sessions, prevSessions),
      icon: MousePointerClick,
    },
    adherence === null
      ? {
          title: "Streak",
          value: `${streak} day${streak === 1 ? "" : "s"}`,
          change: null,
          icon: Flame,
        }
      : {
          title: "Adherence",
          value: `${adherence}%`,
          change: percentChange(adherence, prevAdherence ?? 0),
          icon: CheckCircle2,
        },
  ];
}
