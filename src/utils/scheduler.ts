import dayjs, { type Dayjs } from "dayjs";
import {
  PlanRecommendation,
  PREFERRED_TIMES,
  RescheduleKind,
  ScheduleWarningType,
  UnscheduledReason,
} from "@/lib/goal-meta";
import { TASK_PRIORITY_RANK } from "@/lib/task-meta";
import {
  GoalFocus,
  GoalStatus,
  GoalTaskStatus,
  MilestoneStatus,
  ScheduleEntryStatus,
  type AvailabilityWindow,
  type Goal,
  type GoalTask,
  type Milestone,
  type PlannerSettings,
  type PreferredTime,
  type ScheduleEntry,
} from "@/store/server/goals/interface";
import { startOfWeek } from "@/utils/calendar";
import { formatHours } from "@/utils/format";

export const DATE_KEY = "YYYY-MM-DD";
const MIN_PART_MINUTES = 15;

export interface TimeRange {
  start: number;
  end: number;
}

export interface FreeSlot extends TimeRange {
  date: string;
}

export type BusyBlock = Pick<ScheduleEntry, "Date" | "StartTime" | "EndTime">;

export interface SchedulingContext {
  goals: Goal[];
  milestones: Milestone[];
  tasks: GoalTask[];
  availability: AvailabilityWindow[];
  settings: PlannerSettings;
  entries: ScheduleEntry[];
  /** Time taken by other calendar events, e.g. regular tasks. */
  busy?: BusyBlock[];
  now: Dayjs;
}

export interface ProposedEntry {
  TaskId: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  PartIndex: number;
  PartCount: number;
}

export interface RankedTask {
  task: GoalTask;
  goal: Goal;
  milestone: Milestone;
  score: number;
}

export interface UnscheduledTask {
  task: GoalTask;
  reason: UnscheduledReason;
}

export interface ScheduleWarning {
  type: ScheduleWarningType;
  message: string;
}

export interface SchedulingResult {
  entries: ProposedEntry[];
  unscheduled: UnscheduledTask[];
  warnings: ScheduleWarning[];
  recommendations: PlanRecommendation[];
  capacityMinutes: number;
  requiredMinutes: number;
}

export interface RescheduleOption {
  kind: RescheduleKind;
  entry: ProposedEntry | null;
}

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function formatClock(time: string) {
  return dayjs(`2000-01-01T${time}`).format("h:mm A");
}

export function entryMinutes(
  entry: Pick<ScheduleEntry, "StartTime" | "EndTime">,
) {
  return toMinutes(entry.EndTime) - toMinutes(entry.StartTime);
}

export function dailyLimit(settings: PlannerSettings) {
  return Math.round(
    (settings.MaxDailyMinutes * settings.WorkloadPercent) / 100,
  );
}

function isActiveEntry(entry: ScheduleEntry) {
  return (
    entry.Status === ScheduleEntryStatus.Planned ||
    entry.Status === ScheduleEntryStatus.Done
  );
}

function subtractRanges(range: TimeRange, busy: TimeRange[]) {
  const free: TimeRange[] = [];
  let cursor = range.start;
  for (const block of [...busy].sort((a, b) => a.start - b.start)) {
    if (block.end <= cursor || block.start >= range.end) continue;
    if (block.start > cursor) free.push({ start: cursor, end: block.start });
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < range.end) free.push({ start: cursor, end: range.end });
  return free;
}

/** Minutes already booked per date by planned or completed entries. */
export function bookedMinutesByDate(entries: ScheduleEntry[]) {
  const booked = new Map<string, number>();
  for (const entry of entries.filter(isActiveEntry))
    booked.set(entry.Date, (booked.get(entry.Date) ?? 0) + entryMinutes(entry));
  return booked;
}

/** Total study minutes the availability offers on a date, before bookings. */
export function dayCapacity(
  date: Dayjs,
  availability: AvailabilityWindow[],
  settings: PlannerSettings,
) {
  if (settings.RestDays.includes(date.day())) return 0;
  const total = availability
    .filter((window) => window.DayOfWeek === date.day())
    .reduce(
      (sum, window) =>
        sum + toMinutes(window.EndTime) - toMinutes(window.StartTime),
      0,
    );
  return Math.min(total, dailyLimit(settings));
}

/** Splits events into per-day busy blocks, so multi-day events block each day they cover. */
export function toBusyBlocks(events: { StartAt: string; EndAt: string }[]) {
  const blocks: BusyBlock[] = [];
  for (const event of events) {
    const start = dayjs(event.StartAt);
    const end = dayjs(event.EndAt);
    for (
      let day = start.startOf("day");
      day.isBefore(end);
      day = day.add(1, "day")
    ) {
      const from = start.isAfter(day) ? start : day;
      const to = end.isBefore(day.add(1, "day")) ? end : day.endOf("day");
      blocks.push({
        Date: day.format(DATE_KEY),
        StartTime: from.format("HH:mm"),
        EndTime: to.format("HH:mm"),
      });
    }
  }
  return blocks;
}

export function buildAvailableSlots(
  availability: AvailabilityWindow[],
  settings: PlannerSettings,
  entries: ScheduleEntry[],
  from: Dayjs,
  to: Dayjs,
  now: Dayjs,
  extraBusy: BusyBlock[] = [],
) {
  const busyByDate = new Map<string, BusyBlock[]>();
  for (const block of [...entries.filter(isActiveEntry), ...extraBusy])
    busyByDate.set(block.Date, [...(busyByDate.get(block.Date) ?? []), block]);
  const slots: FreeSlot[] = [];

  for (
    let day = (from.isBefore(now, "day") ? now : from).startOf("day");
    !day.isAfter(to, "day");
    day = day.add(1, "day")
  ) {
    if (settings.RestDays.includes(day.day())) continue;
    const date = day.format(DATE_KEY);
    const earliest = day.isSame(now, "day")
      ? Math.ceil((now.hour() * 60 + now.minute()) / settings.SlotMinutes) *
        settings.SlotMinutes
      : 0;
    const busy = (busyByDate.get(date) ?? []).map((block) => ({
      start: toMinutes(block.StartTime),
      end: toMinutes(block.EndTime),
    }));

    for (const window of availability.filter(
      (w) => w.DayOfWeek === day.day(),
    )) {
      const range = {
        start: Math.max(toMinutes(window.StartTime), earliest),
        end: toMinutes(window.EndTime),
      };
      for (const free of subtractRanges(range, busy))
        if (free.end - free.start >= MIN_PART_MINUTES)
          slots.push({ date, ...free });
    }
  }

  return slots.sort(
    (a, b) => a.date.localeCompare(b.date) || a.start - b.start,
  );
}

function isSatisfied(task: GoalTask | undefined) {
  return (
    !task ||
    task.Status === GoalTaskStatus.Done ||
    task.Status === GoalTaskStatus.Skipped
  );
}

/** Todo tasks of active goals that have no upcoming planned entry. */
export function schedulableTasks(ctx: SchedulingContext) {
  const goals = new Map(ctx.goals.map((goal) => [goal.Id, goal]));
  const milestones = new Map(ctx.milestones.map((m) => [m.Id, m]));
  const planned = new Set(
    ctx.entries
      .filter((entry) => entry.Status === ScheduleEntryStatus.Planned)
      .map((entry) => entry.TaskId),
  );

  return ctx.tasks.flatMap((task) => {
    const milestone = milestones.get(task.MilestoneId);
    const goal = milestone && goals.get(milestone.GoalId);
    if (
      !milestone ||
      !goal ||
      task.Status !== GoalTaskStatus.Todo ||
      planned.has(task.Id) ||
      goal.Status !== GoalStatus.Active ||
      milestone.Status === MilestoneStatus.Completed ||
      milestone.Status === MilestoneStatus.Skipped
    )
      return [];
    return [{ task, goal, milestone }];
  });
}

export function rankTasks(ctx: SchedulingContext) {
  const tasksById = new Map(ctx.tasks.map((task) => [task.Id, task]));
  const missedCount = new Map<string, number>();
  for (const entry of ctx.entries)
    if (entry.Status === ScheduleEntryStatus.Missed)
      missedCount.set(entry.TaskId, (missedCount.get(entry.TaskId) ?? 0) + 1);

  const ranked: RankedTask[] = [];
  const blocked: GoalTask[] = [];

  for (const item of schedulableTasks(ctx)) {
    const { task, goal } = item;
    if (!task.DependsOnIds.every((id) => isSatisfied(tasksById.get(id)))) {
      blocked.push(task);
      continue;
    }

    const daysLeft = task.DueDate
      ? dayjs(task.DueDate).diff(ctx.now.startOf("day"), "day")
      : null;
    const urgency =
      daysLeft === null
        ? 10
        : daysLeft < 0
          ? 100
          : Math.max(0, 100 - daysLeft * 5);
    const priority = (TASK_PRIORITY_RANK.get(task.Priority) ?? 0) * 25;
    const goalWeight =
      (TASK_PRIORITY_RANK.get(goal.Priority) ?? 0) * 10 +
      (goal.Focus === GoalFocus.Primary
        ? 25
        : goal.Focus === GoalFocus.Secondary
          ? 10
          : 0);
    const unlocks = ctx.tasks.filter(
      (other) =>
        other.Status === GoalTaskStatus.Todo &&
        other.DependsOnIds.includes(task.Id),
    ).length;
    const delay = (missedCount.get(task.Id) ?? 0) * 15;

    ranked.push({
      ...item,
      score: urgency + priority + goalWeight + unlocks * 10 + delay,
    });
  }

  return { ranked: ranked.sort((a, b) => b.score - a.score), blocked };
}

function inPreferredTime(start: number, times: PreferredTime[]) {
  return times.some((time) => {
    const meta = PREFERRED_TIMES.get(time);
    return meta ? start >= meta.from && start < meta.to : false;
  });
}

interface SlotScoreInput {
  slot: FreeSlot;
  minutes: number;
  task: GoalTask;
  settings: PlannerSettings;
  load: Map<string, number>;
  averageLoad: number;
  today: Dayjs;
}

function scoreSlot({
  slot,
  minutes,
  task,
  settings,
  load,
  averageLoad,
  today,
}: SlotScoreInput) {
  let score = 0;
  if (task.PreferredTime && inPreferredTime(slot.start, [task.PreferredTime]))
    score += 40;
  else if (inPreferredTime(slot.start, settings.PreferredTimes)) score += 25;

  const dayIndex = dayjs(slot.date).diff(today, "day");
  score += Math.max(0, 20 - dayIndex * (task.DueDate ? 4 : 2));

  const dayLoad = load.get(slot.date) ?? 0;
  score += Math.max(0, 30 - Math.abs(dayLoad + minutes - averageLoad) / 5);

  const leftover = slot.end - slot.start - minutes;
  if (leftover > 0 && leftover < MIN_PART_MINUTES) score -= 15;
  return score;
}

interface PlacementState {
  slots: FreeSlot[];
  load: Map<string, number>;
  limit: number;
}

function fitsDay(state: PlacementState, date: string, minutes: number) {
  return (state.load.get(date) ?? 0) + minutes <= state.limit;
}

function beforeDue(task: GoalTask, date: string) {
  return !task.DueDate || date <= task.DueDate;
}

function book(state: PlacementState, slot: FreeSlot, minutes: number) {
  const start = slot.start;
  slot.start += minutes;
  state.load.set(slot.date, (state.load.get(slot.date) ?? 0) + minutes);
  if (slot.end - slot.start < MIN_PART_MINUTES)
    state.slots.splice(state.slots.indexOf(slot), 1);
  return {
    Date: slot.date,
    StartTime: toTime(start),
    EndTime: toTime(start + minutes),
  };
}

function pickBestSlot(
  state: PlacementState,
  task: GoalTask,
  minutes: number,
  settings: PlannerSettings,
  today: Dayjs,
  predicate: (slot: FreeSlot) => boolean = () => true,
) {
  const days = new Set(state.slots.map((slot) => slot.date));
  const averageLoad =
    [...days].reduce((sum, date) => sum + (state.load.get(date) ?? 0), 0) /
    Math.max(1, days.size);

  let best: FreeSlot | null = null;
  let bestScore = -Infinity;
  for (const slot of state.slots) {
    if (
      slot.end - slot.start < minutes ||
      !fitsDay(state, slot.date, minutes) ||
      !predicate(slot)
    )
      continue;
    const score = scoreSlot({
      slot,
      minutes,
      task,
      settings,
      load: state.load,
      averageLoad,
      today,
    });
    if (score > bestScore) {
      best = slot;
      bestScore = score;
    }
  }
  return best;
}

/** Splits a task across the earliest free slots; returns null if it can't fit. */
function splitTask(state: PlacementState, task: GoalTask) {
  const plan: { slot: FreeSlot; minutes: number }[] = [];
  const reserved = new Map<string, number>();
  let remaining = task.EstimatedMinutes;

  for (const slot of state.slots) {
    if (remaining <= 0) break;
    if (!beforeDue(task, slot.date)) continue;
    const dayRoom =
      state.limit -
      (state.load.get(slot.date) ?? 0) -
      (reserved.get(slot.date) ?? 0);
    const minutes = Math.min(remaining, slot.end - slot.start, dayRoom);
    if (minutes < MIN_PART_MINUTES) continue;
    plan.push({ slot, minutes });
    reserved.set(slot.date, (reserved.get(slot.date) ?? 0) + minutes);
    remaining -= minutes;
  }

  if (remaining > 0) return null;
  return plan.map(({ slot, minutes }) => book(state, slot, minutes));
}

function createState(ctx: SchedulingContext, from: Dayjs, to: Dayjs) {
  return {
    slots: buildAvailableSlots(
      ctx.availability,
      ctx.settings,
      ctx.entries,
      from,
      to,
      ctx.now,
      ctx.busy,
    ),
    load: bookedMinutesByDate(ctx.entries),
    limit: dailyLimit(ctx.settings),
  };
}

function capacityOf(state: PlacementState) {
  const perDay = new Map<string, number>();
  for (const slot of state.slots)
    perDay.set(slot.date, (perDay.get(slot.date) ?? 0) + slot.end - slot.start);
  let total = 0;
  for (const [date, free] of perDay)
    total += Math.max(
      0,
      Math.min(free, state.limit - (state.load.get(date) ?? 0)),
    );
  return total;
}

export function generateSchedule(
  ctx: SchedulingContext,
  from: Dayjs,
  to: Dayjs,
): SchedulingResult {
  const state = createState(ctx, from, to);
  const today = ctx.now.startOf("day");
  const capacityMinutes = capacityOf(state);
  const { ranked, blocked } = rankTasks(ctx);
  const requiredMinutes = ranked.reduce(
    (sum, { task }) => sum + task.EstimatedMinutes,
    0,
  );

  const entries: ProposedEntry[] = [];
  const unscheduled: UnscheduledTask[] = blocked.map((task) => ({
    task,
    reason: UnscheduledReason.BlockedByDependency,
  }));

  for (const { task } of ranked) {
    const slot = pickBestSlot(
      state,
      task,
      task.EstimatedMinutes,
      ctx.settings,
      today,
      (candidate) => beforeDue(task, candidate.date),
    );
    if (slot) {
      entries.push({
        TaskId: task.Id,
        ...book(state, slot, task.EstimatedMinutes),
        PartIndex: 1,
        PartCount: 1,
      });
      continue;
    }

    const parts = splitTask(state, task);
    if (parts) {
      parts.forEach((part, index) =>
        entries.push({
          TaskId: task.Id,
          ...part,
          PartIndex: index + 1,
          PartCount: parts.length,
        }),
      );
      continue;
    }

    unscheduled.push({
      task,
      reason:
        task.DueDate && task.DueDate <= to.format(DATE_KEY)
          ? UnscheduledReason.PastDeadline
          : UnscheduledReason.NoAvailableSlot,
    });
  }

  const warnings: ScheduleWarning[] = [];
  const recommendations = new Set<PlanRecommendation>();

  if (ctx.availability.length === 0) {
    warnings.push({
      type: ScheduleWarningType.NoAvailability,
      message: "No availability is set, so nothing can be scheduled.",
    });
    recommendations.add(PlanRecommendation.AddAvailability);
  }
  if (requiredMinutes > capacityMinutes) {
    warnings.push({
      type: ScheduleWarningType.CapacityExceeded,
      message: `Tasks need ${formatHours(requiredMinutes)} but only ${formatHours(capacityMinutes)} is free in this period.`,
    });
    recommendations.add(PlanRecommendation.ReduceWorkload);
    recommendations.add(PlanRecommendation.AddAvailability);
  }
  const lateTasks = unscheduled.filter(
    (item) => item.reason === UnscheduledReason.PastDeadline,
  );
  if (lateTasks.length > 0) {
    warnings.push({
      type: ScheduleWarningType.DeadlineRisk,
      message: `${lateTasks.length} task${lateTasks.length === 1 ? "" : "s"} can't finish before the due date.`,
    });
    recommendations.add(PlanRecommendation.ExtendDeadline);
  }
  const weekendFree = ctx.availability.some(
    (window) =>
      (window.DayOfWeek === 0 || window.DayOfWeek === 6) &&
      !ctx.settings.RestDays.includes(window.DayOfWeek),
  );
  if (unscheduled.length > blocked.length && !weekendFree)
    recommendations.add(PlanRecommendation.AddWeekendSession);

  return {
    entries: entries.sort(
      (a, b) =>
        a.Date.localeCompare(b.Date) || a.StartTime.localeCompare(b.StartTime),
    ),
    unscheduled,
    warnings,
    recommendations: [...recommendations],
    capacityMinutes,
    requiredMinutes,
  };
}

/** Candidate new slots for a missed entry, one per reschedule option. */
export function suggestReschedule(
  ctx: SchedulingContext,
  entry: ScheduleEntry,
): RescheduleOption[] {
  const task = ctx.tasks.find((item) => item.Id === entry.TaskId);
  if (!task) return [];

  const today = ctx.now.startOf("day");
  const tomorrow = today.add(1, "day").format(DATE_KEY);
  const nextMonday = startOfWeek(today).add(7, "day");
  const minutes = entryMinutes(entry);

  const predicates = new Map<RescheduleKind, (slot: FreeSlot) => boolean>([
    [RescheduleKind.Best, () => true],
    [RescheduleKind.Tomorrow, (slot) => slot.date === tomorrow],
    [
      RescheduleKind.Weekend,
      (slot) => {
        const day = dayjs(slot.date);
        return (
          (day.day() === 0 || day.day() === 6) && day.diff(today, "day") <= 7
        );
      },
    ],
    [
      RescheduleKind.NextWeek,
      (slot) => {
        const day = dayjs(slot.date);
        return (
          !day.isBefore(nextMonday) && day.isBefore(nextMonday.add(7, "day"))
        );
      },
    ],
  ]);

  return [...predicates].map(([kind, predicate]) => {
    const state = createState(ctx, today, today.add(14, "day"));
    const slot = pickBestSlot(
      state,
      task,
      minutes,
      ctx.settings,
      today,
      predicate,
    );
    return {
      kind,
      entry: slot
        ? {
            TaskId: task.Id,
            ...book(state, slot, minutes),
            PartIndex: entry.PartIndex,
            PartCount: entry.PartCount,
          }
        : null,
    };
  });
}
