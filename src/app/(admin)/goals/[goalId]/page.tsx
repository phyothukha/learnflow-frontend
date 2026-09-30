"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  ArrowLeft,
  CalendarClock,
  Flag,
  Hourglass,
  ListChecks,
  Plus,
  SearchX,
  Star,
  TriangleAlert,
} from "lucide-react";
import { DataTableEmptyState } from "@/components/data-table-empty-state";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePageAccess } from "@/hooks/use-page-access";
import { usePlannerHydration } from "@/hooks/use-planner-hydration";
import { GOAL_HEALTH, GOAL_STATUS } from "@/lib/goal-meta";
import { PERMISSIONS } from "@/lib/permissions";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  GoalFocus,
  GoalStatus,
  GoalTaskStatus,
  MilestoneStatus,
  ScheduleEntryStatus,
  type GoalTask,
  type Milestone,
  type ScheduleEntry,
} from "@/store/server/goals/interface";
import { formatHours } from "@/utils/format";
import { goalTasks, summarizeGoal } from "@/utils/goals";
import { GoalActionsMenu } from "../components/goal-actions-menu";
import { GoalFormDialog } from "../components/goal-form-dialog";
import { GoalTaskFormDialog } from "./components/goal-task-form-dialog";
import { MilestoneFormDialog } from "./components/milestone-form-dialog";
import { MilestoneSection } from "./components/milestone-section";

interface MilestoneDialogState {
  open: boolean;
  milestone: Milestone | null;
}

interface TaskDialogState {
  open: boolean;
  task: GoalTask | null;
  milestoneId: string | null;
}

export default function GoalDetailPage() {
  const allowed = usePageAccess(PERMISSIONS.SCHEDULE_VIEW);
  const hydrated = usePlannerHydration();
  if (!allowed || !hydrated) return null;
  return <GoalDetailContent />;
}

function GoalDetailContent() {
  const { goalId } = useParams<{ goalId: string }>();
  const router = useRouter();
  const goal = usePlannerStore((state) =>
    state.goals.find((item) => item.Id === goalId),
  );
  const allMilestones = usePlannerStore((state) => state.milestones);
  const allTasks = usePlannerStore((state) => state.tasks);
  const entries = usePlannerStore((state) => state.entries);
  const [goalDialog, setGoalDialog] = useState(false);
  const [milestoneDialog, setMilestoneDialog] = useState<MilestoneDialogState>({
    open: false,
    milestone: null,
  });
  const [taskDialog, setTaskDialog] = useState<TaskDialogState>({
    open: false,
    task: null,
    milestoneId: null,
  });

  if (!goal) {
    return (
      <div className="planner-panel flex min-h-96">
        <DataTableEmptyState
          icon={SearchX}
          title="Goal not found"
          description="It may have been deleted."
          action={
            <Button asChild variant="subtle">
              <Link href="/goals">
                <ArrowLeft /> Back to goals
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const summary = summarizeGoal(goal, allMilestones, allTasks, dayjs());
  const milestones = allMilestones
    .filter((m) => m.GoalId === goal.Id)
    .sort((a, b) => a.Sequence - b.Sequence);
  const tasks = goalTasks(goal.Id, allMilestones, allTasks);
  const tasksById = new Map(allTasks.map((task) => [task.Id, task]));
  const countedWeight = milestones
    .filter((m) => m.Status !== MilestoneStatus.Skipped)
    .reduce((sum, m) => sum + m.Weight, 0);
  const totalWeight = milestones.reduce((sum, m) => sum + m.Weight, 0);
  const remainingMinutes = tasks
    .filter((task) => task.Status === GoalTaskStatus.Todo)
    .reduce((sum, task) => sum + task.EstimatedMinutes, 0);

  const nextEntries = new Map<string, ScheduleEntry>();
  for (const entry of [...entries]
    .filter((e) => e.Status === ScheduleEntryStatus.Planned)
    .sort((a, b) => (a.Date + a.StartTime).localeCompare(b.Date + b.StartTime)))
    if (!nextEntries.has(entry.TaskId)) nextEntries.set(entry.TaskId, entry);

  const status = GOAL_STATUS.get(goal.Status);
  const health = GOAL_HEALTH.get(summary.health);
  const active = goal.Status === GoalStatus.Active;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/goals"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All goals
      </Link>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            {goal.Focus === GoalFocus.Primary && (
              <Star className="size-4 fill-amber-400 text-amber-400" />
            )}
            {goal.Title}
          </span>
        }
        badge={
          <>
            {status && <Badge variant={status.variant}>{status.label}</Badge>}
            {active && health && (
              <Badge variant={health.variant}>{health.label}</Badge>
            )}
          </>
        }
        description={
          goal.CurrentLevel && goal.TargetLevel
            ? `${goal.CurrentLevel} → ${goal.TargetLevel}${goal.Description ? ` · ${goal.Description}` : ""}`
            : (goal.Description ?? undefined)
        }
        actions={
          <>
            <Button
              onClick={() =>
                setMilestoneDialog({ open: true, milestone: null })
              }
            >
              <Plus /> Milestone
            </Button>
            <GoalActionsMenu
              goal={goal}
              onEdit={() => setGoalDialog(true)}
              onDeleted={() => router.replace("/goals")}
            />
          </>
        }
      />

      {!active && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
          <TriangleAlert className="size-4 shrink-0" />
          This goal is {status?.label.toLowerCase()}, so the planner won&apos;t
          schedule its tasks.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="planner-panel space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="planner-label">Weighted progress</span>
            <span className="text-xs text-muted-foreground">
              expected {summary.expected}% by today
            </span>
          </div>
          <div className="text-3xl font-semibold tabular-nums">
            {summary.progress}%
          </div>
          <ProgressBar
            value={summary.progress}
            expected={summary.expected}
            color={goal.Color}
          />
        </div>
        <StatTile
          label="Tasks"
          icon={ListChecks}
          value={`${summary.doneTasks}/${summary.totalTasks}`}
          hint="completed"
        />
        <StatTile
          label="Remaining"
          icon={Hourglass}
          value={formatHours(remainingMinutes)}
          hint="estimated study time"
        />
        <StatTile
          label="Target"
          icon={CalendarClock}
          value={dayjs(goal.TargetDate).format("MMM D")}
          hint={
            summary.daysLeft >= 0
              ? `${summary.daysLeft} days left`
              : `${-summary.daysLeft} days overdue`
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Flag className="size-4 text-muted-foreground" /> Milestones
        </h2>
        {totalWeight !== 100 && milestones.length > 0 && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Weights add up to {totalWeight}%, so progress is normalized.
          </span>
        )}
      </div>

      {milestones.length === 0 ? (
        <div className="planner-panel flex min-h-64">
          <DataTableEmptyState
            icon={Flag}
            title="No milestones yet"
            description="Break the goal into stages, e.g. N5 → N4 → N3 → N2."
            action={
              <Button
                onClick={() =>
                  setMilestoneDialog({ open: true, milestone: null })
                }
              >
                <Plus /> Add milestone
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <MilestoneSection
              key={milestone.Id}
              milestone={milestone}
              tasks={tasks.filter((task) => task.MilestoneId === milestone.Id)}
              tasksById={tasksById}
              nextEntries={nextEntries}
              weightShare={
                countedWeight && milestone.Status !== MilestoneStatus.Skipped
                  ? Math.round((milestone.Weight / countedWeight) * 100)
                  : 0
              }
              color={goal.Color}
              isFirst={index === 0}
              isLast={index === milestones.length - 1}
              onEdit={() => setMilestoneDialog({ open: true, milestone })}
              onAddTask={() =>
                setTaskDialog({
                  open: true,
                  task: null,
                  milestoneId: milestone.Id,
                })
              }
              onEditTask={(task) =>
                setTaskDialog({
                  open: true,
                  task,
                  milestoneId: task.MilestoneId,
                })
              }
            />
          ))}
        </div>
      )}

      <GoalFormDialog
        open={goalDialog}
        goal={goal}
        onOpenChange={setGoalDialog}
      />
      <MilestoneFormDialog
        open={milestoneDialog.open}
        goalId={goal.Id}
        milestone={milestoneDialog.milestone}
        remainingWeight={Math.max(
          0,
          100 - totalWeight + (milestoneDialog.milestone?.Weight ?? 0),
        )}
        onOpenChange={(open) =>
          setMilestoneDialog((current) => ({ ...current, open }))
        }
      />
      <GoalTaskFormDialog
        open={taskDialog.open}
        task={taskDialog.task}
        defaultMilestoneId={taskDialog.milestoneId}
        milestones={milestones}
        goalTasks={tasks}
        onOpenChange={(open) =>
          setTaskDialog((current) => ({ ...current, open }))
        }
      />
    </div>
  );
}
