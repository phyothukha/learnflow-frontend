import dayjs from "dayjs";
import { DOCUMENT_STATUS_SCORE } from "@/lib/document-status";
import {
  DocumentStatus,
  type StudyDocument,
} from "@/store/server/documents/interface";
import {
  StudyBlockStatus,
  type StudyBlock,
} from "@/store/server/study-blocks/interface";
import type { Topic } from "@/store/server/topics/interface";
import type { Note } from "@/store/server/notes/interface";
import { HEATMAP_STEPS } from "./constants";
import { DEFAULT_TOPIC_COLOR, FALLBACK_TOPIC_COLOR } from "@/utils/colors";
import { toCsv } from "@/utils/csv";

export const NO_TOPIC_LABEL = "No topic";

export const chartTooltipStyle: React.CSSProperties = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
};

export function heatmapCellStyle(minutes: number): React.CSSProperties {
  if (minutes <= 0) return { backgroundColor: "var(--muted)" };
  const step = minutes >= 120 ? 3 : minutes >= 60 ? 2 : minutes >= 30 ? 1 : 0;
  return { backgroundColor: DEFAULT_TOPIC_COLOR, opacity: HEATMAP_STEPS[step] };
}

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

export function topDocuments(documents: StudyDocument[], limit = 5) {
  return [...documents]
    .sort(
      (a, b) =>
        b.TimeSpentMinutes - a.TimeSpentMinutes ||
        (DOCUMENT_STATUS_SCORE.get(b.Status) ?? 0) -
          (DOCUMENT_STATUS_SCORE.get(a.Status) ?? 0),
    )
    .slice(0, limit);
}

export function dashboardGridTemplate(weights: number[]) {
  return weights.map((weight) => `minmax(0,${weight}fr)`).join(" ");
}

export interface TaskOutcomePoint {
  label: string;
  completed: number;
  missed: number;
}

export function buildTaskOutcomeSeries(
  blocks: StudyBlock[],
  rangeStart: dayjs.Dayjs,
  days = 30,
): TaskOutcomePoint[] {
  const byDay = Map.groupBy(blocks, (b) => dayjs(b.StartAt).format(DAY_KEY));
  return Array.from({ length: days }, (_, i) => {
    const day = rangeStart.add(i, "day");
    const dayBlocks = byDay.get(day.format(DAY_KEY)) ?? [];
    return {
      label: day.format("MMM D"),
      completed: countByStatus(dayBlocks, StudyBlockStatus.Done),
      missed: countByStatus(dayBlocks, StudyBlockStatus.Missed),
    };
  });
}

export function countByStatus(blocks: StudyBlock[], status: StudyBlockStatus) {
  return blocks.filter((b) => b.Status === status).length;
}

export interface TaskCounts {
  completed: number;
  missed: number;
}

export function taskCounts(blocks: StudyBlock[]): TaskCounts {
  return {
    completed: countByStatus(blocks, StudyBlockStatus.Done),
    missed: countByStatus(blocks, StudyBlockStatus.Missed),
  };
}

export function seriesCounts(series: TaskOutcomePoint[]): TaskCounts {
  return series.reduce(
    (sum, point) => ({
      completed: sum.completed + point.completed,
      missed: sum.missed + point.missed,
    }),
    { completed: 0, missed: 0 },
  );
}

/** Completed share of decided tasks (done + missed); null when nothing was decided. */
export function completionRate({ completed, missed }: TaskCounts) {
  const decided = completed + missed;
  return decided === 0 ? null : (completed / decided) * 100;
}

export interface WeekdayCountPoint {
  /** Full weekday name; unique, so it can be the chart category. */
  name: string;
  count: number;
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Completed tasks per weekday, Monday first. */
export function buildWeekdayCompleted(
  doneBlocks: StudyBlock[],
): WeekdayCountPoint[] {
  const byWeekday = Map.groupBy(doneBlocks, (b): number =>
    dayjs(b.StartAt).day(),
  );
  return WEEK_ORDER.map((weekday) => ({
    name: WEEKDAY_NAMES[weekday],
    count: byWeekday.get(weekday)?.length ?? 0,
  }));
}

export function formatTimeAgo(iso: string) {
  const minutes = Math.max(0, dayjs().diff(dayjs(iso), "minute"));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export interface KpiTile {
  title: string;
  value: string;
  change: number | null;
  /** `%` is relative change, `pt` is a difference between two percentages. */
  unit: "%" | "pt";
  /** Whether an increase is good news (false for missed tasks). */
  positiveIsGood: boolean;
}

export interface KpiTilesInput {
  activeMembers: number;
  prevActiveMembers: number;
  activeGoals: number;
  completionRate: number | null;
  prevCompletionRate: number | null;
  missedTasks: number;
  prevMissedTasks: number;
}

export function buildKpiTiles({
  activeMembers,
  prevActiveMembers,
  activeGoals,
  completionRate,
  prevCompletionRate,
  missedTasks,
  prevMissedTasks,
}: KpiTilesInput): KpiTile[] {
  return [
    {
      title: "Active members",
      value: activeMembers.toLocaleString(),
      change: percentChange(activeMembers, prevActiveMembers),
      unit: "%",
      positiveIsGood: true,
    },
    {
      title: "Active goals",
      value: activeGoals.toLocaleString(),
      change: null,
      unit: "%",
      positiveIsGood: true,
    },
    {
      title: "Task completion",
      value: completionRate === null ? "—" : `${Math.round(completionRate)}%`,
      change:
        completionRate === null || prevCompletionRate === null
          ? null
          : completionRate - prevCompletionRate,
      unit: "pt",
      positiveIsGood: true,
    },
    {
      title: "Missed tasks",
      value: missedTasks.toLocaleString(),
      change: percentChange(missedTasks, prevMissedTasks),
      unit: "%",
      positiveIsGood: false,
    },
  ];
}

export interface DashboardCsvInput {
  rangeLabel: string;
  tiles: KpiTile[];
  outcomeSeries: TaskOutcomePoint[];
  weekdayData: WeekdayCountPoint[];
  outcomes: { label: string; count: number }[];
}

export function buildDashboardCsv({
  rangeLabel,
  tiles,
  outcomeSeries,
  weekdayData,
  outcomes,
}: DashboardCsvInput) {
  return toCsv([
    ["LearnFlow dashboard", rangeLabel],
    [],
    ["Metric", "Value", "Change vs previous period"],
    ...tiles.map((tile) => [
      tile.title,
      tile.value,
      tile.change === null ? "" : `${tile.change.toFixed(1)} ${tile.unit}`,
    ]),
    [],
    ["Date", "Completed tasks", "Missed tasks"],
    ...outcomeSeries.map((point) => [
      point.label,
      point.completed,
      point.missed,
    ]),
    [],
    ["Weekday", "Completed tasks"],
    ...weekdayData.map((point) => [point.name, point.count]),
    [],
    ["Missed-task outcome", "Count"],
    ...outcomes.map((item) => [item.label, item.count]),
  ]);
}
