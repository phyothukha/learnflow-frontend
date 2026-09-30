import dayjs from "dayjs";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  GoalFocus,
  GoalTaskStatus,
  MilestoneStatus,
  ScheduleEntryStatus,
  type AvailabilityWindow,
  type FocusSession,
  type GoalInput,
  type GoalStatus,
  type GoalTask,
  type GoalTaskInput,
  type Milestone,
  type MilestoneInput,
  type PlannerSettings,
  type ScheduleEntry,
  type WeeklyReview,
} from "@/store/server/goals/interface";
import { DATE_KEY, type ProposedEntry } from "@/utils/scheduler";
import { createPlannerSeed, type PlannerData } from "./planner-seed";

export interface PlannerActions {
  createGoal: (input: GoalInput) => string;
  updateGoal: (id: string, patch: Partial<GoalInput>) => void;
  deleteGoal: (id: string) => void;
  setGoalStatus: (id: string, status: GoalStatus) => void;
  setPrimaryGoal: (id: string) => void;
  createMilestone: (input: MilestoneInput) => void;
  updateMilestone: (id: string, patch: Partial<MilestoneInput>) => void;
  deleteMilestone: (id: string) => void;
  moveMilestone: (id: string, direction: -1 | 1) => void;
  createTask: (input: GoalTaskInput) => void;
  updateTask: (id: string, patch: Partial<GoalTaskInput>) => void;
  deleteTask: (id: string) => void;
  setTaskStatus: (id: string, status: GoalTaskStatus) => void;
  saveAvailability: (
    windows: AvailabilityWindow[],
    settings: PlannerSettings,
  ) => void;
  applySchedule: (entries: ProposedEntry[]) => void;
  clearUpcoming: () => void;
  setEntryStatus: (id: string, status: ScheduleEntryStatus) => void;
  deleteEntry: (id: string) => void;
  rescheduleEntry: (id: string, next: ProposedEntry) => void;
  moveEntry: (
    id: string,
    slot: Pick<ScheduleEntry, "Date" | "StartTime" | "EndTime">,
  ) => void;
  logFocusSession: (
    session: Omit<FocusSession, "Id">,
    completeEntry: boolean,
  ) => void;
  submitReview: (review: Omit<WeeklyReview, "Id" | "CreatedAt">) => void;
  markMissedEntries: () => number;
  resetDemo: () => void;
}

export type PlannerState = PlannerData & PlannerActions;

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Milestone status follows its tasks unless it was skipped by hand. */
function syncMilestones(milestones: Milestone[], tasks: GoalTask[]) {
  return milestones.map((milestone) => {
    if (milestone.Status === MilestoneStatus.Skipped) return milestone;
    const own = tasks.filter(
      (task) =>
        task.MilestoneId === milestone.Id &&
        task.Status !== GoalTaskStatus.Skipped,
    );
    if (own.length === 0) return milestone;
    const done = own.filter((task) => task.Status === GoalTaskStatus.Done);
    const Status =
      done.length === own.length
        ? MilestoneStatus.Completed
        : done.length > 0
          ? MilestoneStatus.InProgress
          : milestone.Status === MilestoneStatus.Completed
            ? MilestoneStatus.InProgress
            : milestone.Status;
    return Status === milestone.Status ? milestone : { ...milestone, Status };
  });
}

function withTaskStatus(
  state: PlannerData,
  ids: Set<string>,
  status: GoalTaskStatus,
): Partial<PlannerData> {
  const tasks = state.tasks.map((task) =>
    ids.has(task.Id)
      ? {
          ...task,
          Status: status,
          CompletedAt:
            status === GoalTaskStatus.Done ? new Date().toISOString() : null,
        }
      : task,
  );
  const entries =
    status === GoalTaskStatus.Todo
      ? state.entries
      : state.entries.filter(
          (entry) =>
            !ids.has(entry.TaskId) ||
            entry.Status !== ScheduleEntryStatus.Planned,
        );
  return {
    tasks,
    entries,
    milestones: syncMilestones(state.milestones, tasks),
  };
}

/** Completes a task once none of its entries are still planned or missed. */
function completeIfFinished(state: PlannerData, taskId: string) {
  const open = state.entries.some(
    (entry) =>
      entry.TaskId === taskId &&
      (entry.Status === ScheduleEntryStatus.Planned ||
        entry.Status === ScheduleEntryStatus.Missed),
  );
  return open
    ? {}
    : withTaskStatus(state, new Set([taskId]), GoalTaskStatus.Done);
}

function toEntry(proposed: ProposedEntry): ScheduleEntry {
  return {
    ...proposed,
    Id: createId("e"),
    Status: ScheduleEntryStatus.Planned,
    RescheduledToId: null,
    CreatedAt: new Date().toISOString(),
  };
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      ...createPlannerSeed(),

      createGoal: (input) => {
        const id = createId("g");
        set((state) => ({
          goals: [
            ...state.goals.map((goal) =>
              input.Focus === GoalFocus.Primary &&
              goal.Focus === GoalFocus.Primary
                ? { ...goal, Focus: GoalFocus.Secondary }
                : goal,
            ),
            { ...input, Id: id, CreatedAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      updateGoal: (id, patch) =>
        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.Id === id) return { ...goal, ...patch };
            return patch.Focus === GoalFocus.Primary &&
              goal.Focus === GoalFocus.Primary
              ? { ...goal, Focus: GoalFocus.Secondary }
              : goal;
          }),
        })),

      deleteGoal: (id) =>
        set((state) => {
          const milestoneIds = new Set(
            state.milestones.filter((m) => m.GoalId === id).map((m) => m.Id),
          );
          const taskIds = new Set(
            state.tasks
              .filter((task) => milestoneIds.has(task.MilestoneId))
              .map((task) => task.Id),
          );
          return {
            goals: state.goals.filter((goal) => goal.Id !== id),
            milestones: state.milestones.filter((m) => !milestoneIds.has(m.Id)),
            tasks: state.tasks.filter((task) => !taskIds.has(task.Id)),
            entries: state.entries.filter((e) => !taskIds.has(e.TaskId)),
            sessions: state.sessions.filter((s) => !taskIds.has(s.TaskId)),
          };
        }),

      setGoalStatus: (id, status) =>
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.Id === id ? { ...goal, Status: status } : goal,
          ),
        })),

      setPrimaryGoal: (id) =>
        get().updateGoal(id, { Focus: GoalFocus.Primary }),

      createMilestone: (input) =>
        set((state) => ({
          milestones: [
            ...state.milestones,
            {
              ...input,
              Id: createId("m"),
              Sequence:
                Math.max(
                  0,
                  ...state.milestones
                    .filter((m) => m.GoalId === input.GoalId)
                    .map((m) => m.Sequence),
                ) + 1,
            },
          ],
        })),

      updateMilestone: (id, patch) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.Id === id ? { ...m, ...patch } : m,
          ),
        })),

      deleteMilestone: (id) =>
        set((state) => {
          const taskIds = new Set(
            state.tasks.filter((t) => t.MilestoneId === id).map((t) => t.Id),
          );
          return {
            milestones: state.milestones.filter((m) => m.Id !== id),
            tasks: state.tasks
              .filter((task) => !taskIds.has(task.Id))
              .map((task) => ({
                ...task,
                DependsOnIds: task.DependsOnIds.filter((d) => !taskIds.has(d)),
              })),
            entries: state.entries.filter((e) => !taskIds.has(e.TaskId)),
          };
        }),

      moveMilestone: (id, direction) =>
        set((state) => {
          const current = state.milestones.find((m) => m.Id === id);
          if (!current) return {};
          const siblings = state.milestones
            .filter((m) => m.GoalId === current.GoalId)
            .sort((a, b) => a.Sequence - b.Sequence);
          const index = siblings.findIndex((m) => m.Id === id);
          const swap = siblings[index + direction];
          if (!swap) return {};
          return {
            milestones: state.milestones.map((m) =>
              m.Id === current.Id
                ? { ...m, Sequence: swap.Sequence }
                : m.Id === swap.Id
                  ? { ...m, Sequence: current.Sequence }
                  : m,
            ),
          };
        }),

      createTask: (input) =>
        set((state) => {
          const tasks = [
            ...state.tasks,
            { ...input, Id: createId("t"), CompletedAt: null },
          ];
          return { tasks, milestones: syncMilestones(state.milestones, tasks) };
        }),

      updateTask: (id, patch) =>
        set((state) => {
          const tasks = state.tasks.map((task) =>
            task.Id === id ? { ...task, ...patch } : task,
          );
          return { tasks, milestones: syncMilestones(state.milestones, tasks) };
        }),

      deleteTask: (id) =>
        set((state) => {
          const tasks = state.tasks
            .filter((task) => task.Id !== id)
            .map((task) => ({
              ...task,
              DependsOnIds: task.DependsOnIds.filter((d) => d !== id),
            }));
          return {
            tasks,
            milestones: syncMilestones(state.milestones, tasks),
            entries: state.entries.filter((entry) => entry.TaskId !== id),
          };
        }),

      setTaskStatus: (id, status) =>
        set((state) => withTaskStatus(state, new Set([id]), status)),

      saveAvailability: (availability, settings) =>
        set({ availability, settings }),

      applySchedule: (proposed) =>
        set((state) => ({
          entries: [...state.entries, ...proposed.map(toEntry)],
        })),

      clearUpcoming: () =>
        set((state) => {
          const today = dayjs().format(DATE_KEY);
          return {
            entries: state.entries.filter(
              (entry) =>
                entry.Status !== ScheduleEntryStatus.Planned ||
                entry.Date < today,
            ),
          };
        }),

      setEntryStatus: (id, status) =>
        set((state) => {
          const entry = state.entries.find((e) => e.Id === id);
          if (!entry) return {};
          const next = {
            ...state,
            entries: state.entries.map((e) =>
              e.Id === id ? { ...e, Status: status } : e,
            ),
          };
          if (status === ScheduleEntryStatus.Done)
            return {
              entries: next.entries,
              ...completeIfFinished(next, entry.TaskId),
            };
          const task = state.tasks.find((t) => t.Id === entry.TaskId);
          return task?.Status === GoalTaskStatus.Done
            ? {
                entries: next.entries,
                ...withTaskStatus(
                  next,
                  new Set([task.Id]),
                  GoalTaskStatus.Todo,
                ),
              }
            : { entries: next.entries };
        }),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.Id !== id),
        })),

      rescheduleEntry: (id, proposed) =>
        set((state) => {
          const created = toEntry(proposed);
          return {
            entries: [
              ...state.entries.map((entry) =>
                entry.Id === id
                  ? {
                      ...entry,
                      Status: ScheduleEntryStatus.Rescheduled,
                      RescheduledToId: created.Id,
                    }
                  : entry,
              ),
              created,
            ],
          };
        }),

      moveEntry: (id, slot) =>
        set((state) => {
          const now = dayjs();
          const upcoming =
            slot.Date > now.format(DATE_KEY) ||
            (slot.Date === now.format(DATE_KEY) &&
              slot.EndTime > now.format("HH:mm"));
          return {
            entries: state.entries.map((entry) =>
              entry.Id === id
                ? {
                    ...entry,
                    ...slot,
                    Status:
                      entry.Status === ScheduleEntryStatus.Missed && upcoming
                        ? ScheduleEntryStatus.Planned
                        : entry.Status,
                  }
                : entry,
            ),
          };
        }),

      logFocusSession: (session, completeEntry) =>
        set((state) => {
          const sessions = [
            ...state.sessions,
            { ...session, Id: createId("s") },
          ];
          if (!completeEntry) return { sessions };
          if (!session.EntryId)
            return {
              sessions,
              ...withTaskStatus(
                state,
                new Set([session.TaskId]),
                GoalTaskStatus.Done,
              ),
            };
          const entries = state.entries.map((entry) =>
            entry.Id === session.EntryId
              ? { ...entry, Status: ScheduleEntryStatus.Done }
              : entry,
          );
          return {
            sessions,
            entries,
            ...completeIfFinished({ ...state, entries }, session.TaskId),
          };
        }),

      submitReview: (review) =>
        set((state) => {
          const previous = state.reviews.find(
            (r) => r.WeekStart === review.WeekStart,
          );
          const delta =
            review.WorkloadAdjustment - (previous?.WorkloadAdjustment ?? 0);
          return {
            reviews: [
              ...state.reviews.filter((r) => r !== previous),
              {
                ...review,
                Id: createId("r"),
                CreatedAt: new Date().toISOString(),
              },
            ],
            settings: {
              ...state.settings,
              WorkloadPercent: Math.min(
                150,
                Math.max(50, state.settings.WorkloadPercent + delta),
              ),
            },
          };
        }),

      markMissedEntries: () => {
        const now = dayjs();
        const today = now.format(DATE_KEY);
        const clock = now.format("HH:mm");
        const overdue = get().entries.filter(
          (entry) =>
            entry.Status === ScheduleEntryStatus.Planned &&
            (entry.Date < today ||
              (entry.Date === today && entry.EndTime <= clock)),
        );
        if (overdue.length === 0) return 0;
        const ids = new Set(overdue.map((entry) => entry.Id));
        set((state) => ({
          entries: state.entries.map((entry) =>
            ids.has(entry.Id)
              ? { ...entry, Status: ScheduleEntryStatus.Missed }
              : entry,
          ),
        }));
        return overdue.length;
      },

      resetDemo: () => set(createPlannerSeed()),
    }),
    {
      name: "learnflow-planner",
      version: 2,
      migrate: (persisted, version) => {
        const data = persisted as PlannerData;
        if (version < 2)
          data.tasks = data.tasks.map((task) => ({
            ...task,
            Steps: task.Steps ?? [],
          }));
        return data as PlannerState;
      },
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({
        goals,
        milestones,
        tasks,
        availability,
        settings,
        entries,
        sessions,
        reviews,
      }): PlannerData => ({
        goals,
        milestones,
        tasks,
        availability,
        settings,
        entries,
        sessions,
        reviews,
      }),
    },
  ),
);
