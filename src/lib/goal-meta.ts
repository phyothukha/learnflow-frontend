import {
  Briefcase,
  Code2,
  Dumbbell,
  Languages,
  PiggyBank,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { BadgeVariant } from "@/components/ui/badge";
import {
  GoalCategory,
  GoalFocus,
  GoalStatus,
  GoalTaskStatus,
  MilestoneStatus,
  PreferredTime,
  ReviewMood,
  ScheduleEntryStatus,
} from "@/store/server/goals/interface";

export interface StatusMeta {
  label: string;
  variant: BadgeVariant;
}

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
}

export interface PreferredTimeMeta {
  label: string;
  /** Minutes from midnight, end exclusive. */
  from: number;
  to: number;
}

export interface MoodMeta {
  label: string;
  emoji: string;
}

export enum GoalHealth {
  OnTrack = "OnTrack",
  SlightlyBehind = "SlightlyBehind",
  Behind = "Behind",
  Ahead = "Ahead",
}

export enum BurnoutRisk {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}

export enum UnscheduledReason {
  NoAvailableSlot = "NO_AVAILABLE_SLOT",
  PastDeadline = "PAST_DEADLINE",
  BlockedByDependency = "BLOCKED_BY_DEPENDENCY",
}

export enum ScheduleWarningType {
  CapacityExceeded = "CAPACITY_EXCEEDED",
  DeadlineRisk = "DEADLINE_RISK",
  NoAvailability = "NO_AVAILABILITY",
}

export enum PlanRecommendation {
  ExtendDeadline = "EXTEND_DEADLINE",
  ReduceWorkload = "REDUCE_WORKLOAD",
  AddAvailability = "ADD_AVAILABILITY",
  AddWeekendSession = "ADD_WEEKEND_SESSION",
}

export enum RescheduleKind {
  Best = "best",
  Tomorrow = "tomorrow",
  Weekend = "weekend",
  NextWeek = "next-week",
}

export const UNSCHEDULED_REASONS = new Map<UnscheduledReason, string>([
  [UnscheduledReason.NoAvailableSlot, "No free slot fits this task"],
  [UnscheduledReason.PastDeadline, "Not enough time before the due date"],
  [UnscheduledReason.BlockedByDependency, "Waiting on another task"],
]);

export const PLAN_RECOMMENDATIONS = new Map<PlanRecommendation, string>([
  [PlanRecommendation.ExtendDeadline, "Extend the due date of tight tasks"],
  [PlanRecommendation.ReduceWorkload, "Reduce the number of tasks this week"],
  [PlanRecommendation.AddAvailability, "Add more study time to availability"],
  [PlanRecommendation.AddWeekendSession, "Add a weekend study session"],
]);

export const RESCHEDULE_KINDS = new Map<RescheduleKind, string>([
  [RescheduleKind.Best, "Best slot"],
  [RescheduleKind.Tomorrow, "Tomorrow"],
  [RescheduleKind.Weekend, "Weekend"],
  [RescheduleKind.NextWeek, "Next week"],
]);

export const GOAL_STATUS = new Map<GoalStatus, StatusMeta>([
  [GoalStatus.Active, { label: "Active", variant: "status-blue" }],
  [GoalStatus.Paused, { label: "Paused", variant: "status-amber" }],
  [GoalStatus.Completed, { label: "Completed", variant: "status-green" }],
  [GoalStatus.Archived, { label: "Archived", variant: "status-slate" }],
]);

export const GOAL_CATEGORIES = new Map<GoalCategory, CategoryMeta>([
  [GoalCategory.Language, { label: "Language", icon: Languages }],
  [GoalCategory.Certification, { label: "Certification", icon: Briefcase }],
  [GoalCategory.Programming, { label: "Programming", icon: Code2 }],
  [GoalCategory.Health, { label: "Health", icon: Dumbbell }],
  [GoalCategory.Finance, { label: "Finance", icon: PiggyBank }],
  [GoalCategory.Other, { label: "Other", icon: Target }],
]);

export const GOAL_FOCUS = new Map<GoalFocus, StatusMeta>([
  [GoalFocus.Primary, { label: "Primary goal", variant: "default" }],
  [GoalFocus.Secondary, { label: "Secondary goal", variant: "secondary" }],
  [GoalFocus.None, { label: "No focus", variant: "outline" }],
]);

export const GOAL_COLORS = [
  "#3a5bf0",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
];

export const GOAL_HEALTH = new Map<GoalHealth, StatusMeta>([
  [GoalHealth.Ahead, { label: "Ahead", variant: "status-green" }],
  [GoalHealth.OnTrack, { label: "On track", variant: "status-green" }],
  [
    GoalHealth.SlightlyBehind,
    { label: "Slightly behind", variant: "status-amber" },
  ],
  [GoalHealth.Behind, { label: "Behind", variant: "status-red" }],
]);

export const MILESTONE_STATUS = new Map<MilestoneStatus, StatusMeta>([
  [
    MilestoneStatus.NotStarted,
    { label: "Not started", variant: "status-slate" },
  ],
  [
    MilestoneStatus.InProgress,
    { label: "In progress", variant: "status-blue" },
  ],
  [MilestoneStatus.Completed, { label: "Completed", variant: "status-green" }],
  [MilestoneStatus.Skipped, { label: "Skipped", variant: "status-amber" }],
]);

export const GOAL_TASK_STATUS = new Map<GoalTaskStatus, StatusMeta>([
  [GoalTaskStatus.Todo, { label: "To do", variant: "status-slate" }],
  [GoalTaskStatus.Done, { label: "Done", variant: "status-green" }],
  [GoalTaskStatus.Skipped, { label: "Skipped", variant: "status-amber" }],
]);

export const ENTRY_STATUS = new Map<ScheduleEntryStatus, StatusMeta>([
  [ScheduleEntryStatus.Planned, { label: "Planned", variant: "status-blue" }],
  [ScheduleEntryStatus.Done, { label: "Done", variant: "status-green" }],
  [ScheduleEntryStatus.Missed, { label: "Missed", variant: "status-red" }],
  [
    ScheduleEntryStatus.Rescheduled,
    { label: "Rescheduled", variant: "status-slate" },
  ],
]);

export const PREFERRED_TIMES = new Map<PreferredTime, PreferredTimeMeta>([
  [PreferredTime.Morning, { label: "Morning", from: 5 * 60, to: 12 * 60 }],
  [PreferredTime.Afternoon, { label: "Afternoon", from: 12 * 60, to: 17 * 60 }],
  [PreferredTime.Evening, { label: "Evening", from: 17 * 60, to: 21 * 60 }],
  [PreferredTime.Night, { label: "Night", from: 21 * 60, to: 24 * 60 }],
]);

export const REVIEW_MOODS = new Map<ReviewMood, MoodMeta>([
  [ReviewMood.Great, { label: "Great", emoji: "😊" }],
  [ReviewMood.Normal, { label: "Normal", emoji: "😐" }],
  [ReviewMood.Difficult, { label: "Difficult", emoji: "😫" }],
]);

export const BURNOUT_RISK = new Map<BurnoutRisk, StatusMeta>([
  [BurnoutRisk.Low, { label: "Low", variant: "status-green" }],
  [BurnoutRisk.Medium, { label: "Medium", variant: "status-amber" }],
  [BurnoutRisk.High, { label: "High", variant: "status-red" }],
]);

export const WORKLOAD_ADJUSTMENTS = [-20, -10, 0, 10];

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Monday-first display order of `DayOfWeek` values. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const ESTIMATE_OPTIONS = [15, 20, 30, 45, 60, 90, 120, 180];
