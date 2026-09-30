import dayjs, { type Dayjs } from "dayjs";
import { BurnoutRisk, GoalHealth } from "@/lib/goal-meta";
import {
  GoalTaskStatus,
  MilestoneStatus,
  ReviewMood,
  ScheduleEntryStatus,
  type FocusSession,
  type Goal,
  type GoalTask,
  type Milestone,
  type ScheduleEntry,
  type WeeklyReview,
} from "@/store/server/goals/interface";
import { DATE_KEY, entryMinutes } from "@/utils/scheduler";

export interface DayStats {
  date: string;
  planned: number;
  actual: number;
}

export interface WeekStats {
  plannedMinutes: number;
  actualMinutes: number;
  tasksPlanned: number;
  tasksCompleted: number;
  completionRate: number;
  consistencyDays: number;
  missedCount: number;
  days: DayStats[];
}

export interface BurnoutAssessment {
  risk: BurnoutRisk;
  signals: string[];
}

function clampPercent(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function milestoneProgress(milestone: Milestone, tasks: GoalTask[]) {
  if (milestone.Status === MilestoneStatus.Completed) return 100;
  const own = tasks.filter(
    (task) =>
      task.MilestoneId === milestone.Id &&
      task.Status !== GoalTaskStatus.Skipped,
  );
  const total = own.reduce((sum, task) => sum + task.EstimatedMinutes, 0);
  if (total === 0) return 0;
  const done = own
    .filter((task) => task.Status === GoalTaskStatus.Done)
    .reduce((sum, task) => sum + task.EstimatedMinutes, 0);
  return clampPercent((done / total) * 100);
}

/** Progress weighted by each milestone's `Weight`; skipped milestones don't count. */
export function goalProgress(
  goal: Goal,
  milestones: Milestone[],
  tasks: GoalTask[],
) {
  const own = milestones.filter(
    (m) => m.GoalId === goal.Id && m.Status !== MilestoneStatus.Skipped,
  );
  const totalWeight = own.reduce((sum, m) => sum + m.Weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = own.reduce(
    (sum, m) => sum + m.Weight * milestoneProgress(m, tasks),
    0,
  );
  return clampPercent(weighted / totalWeight);
}

export function expectedProgress(goal: Goal, now: Dayjs) {
  const start = dayjs(goal.StartDate);
  const total = dayjs(goal.TargetDate).diff(start, "day");
  if (total <= 0) return 100;
  return clampPercent((now.diff(start, "day") / total) * 100);
}

export function goalHealth(actual: number, expected: number) {
  const gap = actual - expected;
  if (gap >= 5) return GoalHealth.Ahead;
  if (gap >= -5) return GoalHealth.OnTrack;
  if (gap >= -15) return GoalHealth.SlightlyBehind;
  return GoalHealth.Behind;
}

export function nextMilestone(goalId: string, milestones: Milestone[]) {
  return milestones
    .filter(
      (m) =>
        m.GoalId === goalId &&
        m.Status !== MilestoneStatus.Completed &&
        m.Status !== MilestoneStatus.Skipped,
    )
    .sort((a, b) => a.Sequence - b.Sequence)[0];
}

export function goalTasks(
  goalId: string,
  milestones: Milestone[],
  tasks: GoalTask[],
) {
  const ids = new Set(
    milestones.filter((m) => m.GoalId === goalId).map((m) => m.Id),
  );
  return tasks.filter((task) => ids.has(task.MilestoneId));
}

export interface TaskContext {
  task: GoalTask;
  milestone: Milestone;
  goal: Goal;
}

export function taskLookup(
  goals: Goal[],
  milestones: Milestone[],
  tasks: GoalTask[],
) {
  const goalsById = new Map(goals.map((goal) => [goal.Id, goal]));
  const milestonesById = new Map(milestones.map((m) => [m.Id, m]));
  const lookup = new Map<string, TaskContext>();
  for (const task of tasks) {
    const milestone = milestonesById.get(task.MilestoneId);
    const goal = milestone && goalsById.get(milestone.GoalId);
    if (milestone && goal) lookup.set(task.Id, { task, milestone, goal });
  }
  return lookup;
}

export interface GoalSummary {
  goal: Goal;
  progress: number;
  expected: number;
  health: GoalHealth;
  next: Milestone | undefined;
  daysLeft: number;
  doneTasks: number;
  totalTasks: number;
}

export function summarizeGoal(
  goal: Goal,
  milestones: Milestone[],
  tasks: GoalTask[],
  now: Dayjs,
): GoalSummary {
  const progress = goalProgress(goal, milestones, tasks);
  const expected = expectedProgress(goal, now);
  const own = goalTasks(goal.Id, milestones, tasks).filter(
    (task) => task.Status !== GoalTaskStatus.Skipped,
  );
  return {
    goal,
    progress,
    expected,
    health: goalHealth(progress, expected),
    next: nextMilestone(goal.Id, milestones),
    daysLeft: dayjs(goal.TargetDate).diff(now.startOf("day"), "day"),
    doneTasks: own.filter((task) => task.Status === GoalTaskStatus.Done).length,
    totalTasks: own.length,
  };
}

export function weekStats(
  weekStart: Dayjs,
  entries: ScheduleEntry[],
  sessions: FocusSession[],
): WeekStats {
  const weekEnd = weekStart.add(7, "day");
  const inWeek = (date: Dayjs) =>
    !date.isBefore(weekStart) && date.isBefore(weekEnd);

  const counted = entries.filter(
    (entry) =>
      entry.Status !== ScheduleEntryStatus.Rescheduled &&
      inWeek(dayjs(entry.Date)),
  );
  const done = counted.filter((e) => e.Status === ScheduleEntryStatus.Done);
  const weekSessions = sessions.filter((s) => inWeek(dayjs(s.StartedAt)));
  const sessionEntryIds = new Set(weekSessions.map((s) => s.EntryId));

  const days: DayStats[] = Array.from({ length: 7 }, (_, index) => {
    const date = weekStart.add(index, "day").format(DATE_KEY);
    const planned = counted
      .filter((e) => e.Date === date)
      .reduce((sum, e) => sum + entryMinutes(e), 0);
    const fromSessions = weekSessions
      .filter((s) => dayjs(s.StartedAt).format(DATE_KEY) === date)
      .reduce((sum, s) => sum + s.DurationMinutes, 0);
    const fromEntries = done
      .filter((e) => e.Date === date && !sessionEntryIds.has(e.Id))
      .reduce((sum, e) => sum + entryMinutes(e), 0);
    return { date, planned, actual: fromSessions + fromEntries };
  });

  return {
    plannedMinutes: days.reduce((sum, d) => sum + d.planned, 0),
    actualMinutes: days.reduce((sum, d) => sum + d.actual, 0),
    tasksPlanned: new Set(counted.map((e) => e.TaskId)).size,
    tasksCompleted: new Set(done.map((e) => e.TaskId)).size,
    completionRate: counted.length
      ? clampPercent((done.length / counted.length) * 100)
      : 0,
    consistencyDays: days.filter((d) => d.actual > 0).length,
    missedCount: counted.filter((e) => e.Status === ScheduleEntryStatus.Missed)
      .length,
    days,
  };
}

export function assessBurnout(
  stats: WeekStats,
  reviews: WeeklyReview[],
): BurnoutAssessment {
  const recent = [...reviews]
    .sort((a, b) => b.WeekStart.localeCompare(a.WeekStart))
    .slice(0, 3);
  const signals: string[] = [];

  if (stats.tasksPlanned > 0 && stats.completionRate < 50)
    signals.push("Less than half of this week's sessions were completed.");
  if (
    recent.length >= 2 &&
    recent.slice(0, 2).every((r) => r.Mood === ReviewMood.Difficult)
  )
    signals.push("The last two weeks were reported as difficult.");
  if (
    recent.length === 3 &&
    recent[0].CompletionRate < recent[1].CompletionRate &&
    recent[1].CompletionRate < recent[2].CompletionRate
  )
    signals.push("Completion rate has dropped three weeks in a row.");
  if (
    stats.plannedMinutes > 0 &&
    stats.actualMinutes > stats.plannedMinutes * 1.25
  )
    signals.push("You studied far more than planned; watch for overwork.");

  return {
    risk:
      signals.length >= 2
        ? BurnoutRisk.High
        : signals.length === 1
          ? BurnoutRisk.Medium
          : BurnoutRisk.Low,
    signals,
  };
}

/** Suggested change to `WorkloadPercent`, in percentage points. */
export function suggestAdjustment(stats: WeekStats, mood: ReviewMood) {
  if (mood === ReviewMood.Difficult || stats.completionRate < 50) return -20;
  if (stats.completionRate < 70) return -10;
  if (mood === ReviewMood.Great && stats.completionRate >= 95) return 10;
  return 0;
}
