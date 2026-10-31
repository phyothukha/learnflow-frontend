import dayjs from "dayjs";
import {
  buildWeekdayCompleted,
  type TaskOutcomePoint,
  type WeekdayCountPoint,
} from "@/utils/dashboard";

/** Placeholder data until missed-task decisions and goal templates exist in the API. */

export enum MissedOutcome {
  Rescheduled = "Rescheduled",
  MarkedOverdue = "MarkedOverdue",
  AccountabilityCheckIn = "AccountabilityCheckIn",
  SkippedStreakReset = "SkippedStreakReset",
  AutoApplied = "AutoApplied",
}

interface MissedOutcomeMeta {
  label: string;
  /** Short label used on the event badge. */
  badge: string;
  barClass: string;
}

export const MISSED_OUTCOME_META = new Map<MissedOutcome, MissedOutcomeMeta>([
  [
    MissedOutcome.Rescheduled,
    { label: "Rescheduled", badge: "Rescheduled", barClass: "bg-primary" },
  ],
  [
    MissedOutcome.MarkedOverdue,
    { label: "Marked overdue", badge: "Overdue", barClass: "bg-amber-500" },
  ],
  [
    MissedOutcome.AccountabilityCheckIn,
    {
      label: "Accountability check-in",
      badge: "Check-in",
      barClass: "bg-violet-500",
    },
  ],
  [
    MissedOutcome.SkippedStreakReset,
    {
      label: "Skipped · streak reset",
      badge: "Skipped",
      barClass: "bg-rose-500",
    },
  ],
  [
    MissedOutcome.AutoApplied,
    { label: "Auto-applied rule", badge: "Auto", barClass: "bg-slate-500" },
  ],
]);

export interface MissedOutcomeCount {
  Outcome: MissedOutcome;
  Count: number;
}

export interface MissedEvent {
  Id: string;
  MemberName: string;
  TaskTitle: string;
  Outcome: MissedOutcome;
  OccurredAt: string;
}

export interface GoalTemplateUsage {
  Id: string;
  Name: string;
  Category: string;
  Plan: string;
  Uses: number;
  IsDraft: boolean;
}

export function createFakeOutcomeCounts(): MissedOutcomeCount[] {
  return [
    [MissedOutcome.Rescheduled, 46],
    [MissedOutcome.MarkedOverdue, 21],
    [MissedOutcome.AccountabilityCheckIn, 17],
    [MissedOutcome.SkippedStreakReset, 12],
    [MissedOutcome.AutoApplied, 9],
  ].map(([Outcome, Count]) => ({
    Outcome: Outcome as MissedOutcome,
    Count: Count as number,
  }));
}

export function createFakeMissedEvents(): MissedEvent[] {
  const ago = (minutes: number) =>
    dayjs().subtract(minutes, "minute").toISOString();
  return [
    ["Aye Chan", "Kanji flashcards", MissedOutcome.Rescheduled, 36],
    ["Zaw Lin", "FE past paper", MissedOutcome.SkippedStreakReset, 120],
    ["Kenji Tanaka", "Run 5 km", MissedOutcome.AccountabilityCheckIn, 300],
    ["Hnin Wai", "Grammar chapter", MissedOutcome.MarkedOverdue, 540],
    [
      "Mya Thandar",
      "Security fundamentals quiz",
      MissedOutcome.Rescheduled,
      660,
    ],
  ].map(([MemberName, TaskTitle, Outcome, minutes], index) => ({
    Id: `event-${index + 1}`,
    MemberName: MemberName as string,
    TaskTitle: TaskTitle as string,
    Outcome: Outcome as MissedOutcome,
    OccurredAt: ago(minutes as number),
  }));
}

export function createFakeGoalTemplates(): GoalTemplateUsage[] {
  return [
    ["Daily workout — 30 days", "Fitness", "1 Month", 214, false],
    ["JLPT N3 — 1 year", "Language", "1 Year", 128, false],
    ["ITPEC FE — 1-month sprint", "Certification", "1 Month", 86, false],
    ["Exam revision — 1 month", "Study", "1 Month", 0, true],
  ].map(([Name, Category, Plan, Uses, IsDraft], index) => ({
    Id: `template-${index + 1}`,
    Name: Name as string,
    Category: Category as string,
    Plan: Plan as string,
    Uses: Uses as number,
    IsDraft: IsDraft as boolean,
  }));
}

/** Deterministic sample so the charts keep a stable shape; `seed` varies the pattern. */
export function createFakeTaskOutcomeSeries(
  rangeStart: dayjs.Dayjs,
  days: number,
  seed = 0,
): TaskOutcomePoint[] {
  return Array.from({ length: days }, (_, i) => ({
    label: rangeStart.add(i, "day").format("MMM D"),
    completed: 8 + ((i * 7 + seed * 3 + 3) % 9),
    missed: 1 + ((i * 5 + seed * 2 + 2) % 4),
  }));
}

const FAKE_WEEKDAY_COUNTS = [52, 54, 50, 56, 62, 48, 55];

export function createFakeWeekdayCompleted(): WeekdayCountPoint[] {
  return buildWeekdayCompleted([]).map((point, index) => ({
    ...point,
    count: FAKE_WEEKDAY_COUNTS[index],
  }));
}
