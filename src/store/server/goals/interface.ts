import type { TaskPriority } from "@/store/server/tasks/interface";

export enum GoalStatus {
  Active = "Active",
  Paused = "Paused",
  Completed = "Completed",
  Archived = "Archived",
}

export enum GoalCategory {
  Language = "Language",
  Certification = "Certification",
  Programming = "Programming",
  Health = "Health",
  Finance = "Finance",
  Other = "Other",
}

export enum GoalFocus {
  Primary = "Primary",
  Secondary = "Secondary",
  None = "None",
}

export enum MilestoneStatus {
  NotStarted = "NotStarted",
  InProgress = "InProgress",
  Completed = "Completed",
  Skipped = "Skipped",
}

export enum GoalTaskStatus {
  Todo = "Todo",
  Done = "Done",
  Skipped = "Skipped",
}

export enum PreferredTime {
  Morning = "Morning",
  Afternoon = "Afternoon",
  Evening = "Evening",
  Night = "Night",
}

export enum ScheduleEntryStatus {
  Planned = "Planned",
  Done = "Done",
  Missed = "Missed",
  Rescheduled = "Rescheduled",
}

export enum ReviewMood {
  Great = "Great",
  Normal = "Normal",
  Difficult = "Difficult",
}

export interface Goal {
  Id: string;
  Title: string;
  Description: string | null;
  Category: GoalCategory;
  CurrentLevel: string | null;
  TargetLevel: string | null;
  StartDate: string;
  TargetDate: string;
  Priority: TaskPriority;
  Status: GoalStatus;
  Focus: GoalFocus;
  Color: string;
  CreatedAt: string;
}

export interface Milestone {
  Id: string;
  GoalId: string;
  Title: string;
  Description: string | null;
  Sequence: number;
  StartDate: string | null;
  TargetDate: string | null;
  Weight: number;
  Status: MilestoneStatus;
}

export interface GoalTaskStep {
  Id: string;
  Title: string;
  Done: boolean;
}

export interface GoalTask {
  Id: string;
  MilestoneId: string;
  Title: string;
  Description: string | null;
  EstimatedMinutes: number;
  Priority: TaskPriority;
  DueDate: string | null;
  PreferredTime: PreferredTime | null;
  DependsOnIds: string[];
  Steps: GoalTaskStep[];
  Status: GoalTaskStatus;
  CompletedAt: string | null;
}

export interface AvailabilityWindow {
  Id: string;
  /** 0 = Sunday … 6 = Saturday. */
  DayOfWeek: number;
  StartTime: string;
  EndTime: string;
}

export interface PlannerSettings {
  MaxDailyMinutes: number;
  RestDays: number[];
  PreferredTimes: PreferredTime[];
  SlotMinutes: number;
  /** Scales the daily limit after weekly reviews, e.g. 80 = 80%. */
  WorkloadPercent: number;
}

export interface ScheduleEntry {
  Id: string;
  TaskId: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  Status: ScheduleEntryStatus;
  PartIndex: number;
  PartCount: number;
  RescheduledToId: string | null;
  CreatedAt: string;
}

export interface FocusSession {
  Id: string;
  TaskId: string;
  EntryId: string | null;
  StartedAt: string;
  EndedAt: string;
  DurationMinutes: number;
}

export interface WeeklyReview {
  Id: string;
  WeekStart: string;
  PlannedMinutes: number;
  ActualMinutes: number;
  TasksPlanned: number;
  TasksCompleted: number;
  CompletionRate: number;
  ConsistencyDays: number;
  Mood: ReviewMood;
  Notes: string | null;
  WorkloadAdjustment: number;
  CreatedAt: string;
}

export type GoalInput = Omit<Goal, "Id" | "CreatedAt">;
export type MilestoneInput = Omit<Milestone, "Id" | "Sequence">;
export type GoalTaskInput = Omit<GoalTask, "Id" | "CompletedAt">;
