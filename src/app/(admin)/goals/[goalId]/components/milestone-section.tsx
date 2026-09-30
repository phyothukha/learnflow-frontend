"use client";

import dayjs from "dayjs";
import {
  ArrowDown,
  ArrowUp,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Link2,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  SkipForward,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  GOAL_TASK_STATUS,
  MILESTONE_STATUS,
  PREFERRED_TIMES,
} from "@/lib/goal-meta";
import { TASK_PRIORITY } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  GoalTaskStatus,
  MilestoneStatus,
  type GoalTask,
  type Milestone,
  type ScheduleEntry,
} from "@/store/server/goals/interface";
import { formatHours } from "@/utils/format";
import { milestoneProgress } from "@/utils/goals";
import { formatClock } from "@/utils/scheduler";

export interface MilestoneSectionProps {
  milestone: Milestone;
  tasks: GoalTask[];
  tasksById: Map<string, GoalTask>;
  nextEntries: Map<string, ScheduleEntry>;
  weightShare: number;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onAddTask: () => void;
  onEditTask: (task: GoalTask) => void;
}

export function MilestoneSection({
  milestone,
  tasks,
  tasksById,
  nextEntries,
  weightShare,
  color,
  isFirst,
  isLast,
  onEdit,
  onAddTask,
  onEditTask,
}: MilestoneSectionProps) {
  const moveMilestone = usePlannerStore((state) => state.moveMilestone);
  const deleteMilestone = usePlannerStore((state) => state.deleteMilestone);
  const updateMilestone = usePlannerStore((state) => state.updateMilestone);
  const { confirmDelete, dialogProps } = useConfirmDialog();
  const progress = milestoneProgress(milestone, tasks);
  const status = MILESTONE_STATUS.get(milestone.Status);
  const skipped = milestone.Status === MilestoneStatus.Skipped;
  const remaining = tasks
    .filter((task) => task.Status === GoalTaskStatus.Todo)
    .reduce((sum, task) => sum + task.EstimatedMinutes, 0);

  return (
    <section
      className={cn("planner-panel space-y-4", skipped && "opacity-70")}
      aria-labelledby={`milestone-${milestone.Id}`}
    >
      <header className="flex items-start gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {milestone.Sequence}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={`milestone-${milestone.Id}`} className="font-semibold">
              {milestone.Title}
            </h3>
            {status && <Badge variant={status.variant}>{status.label}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            Weight {milestone.Weight} ({weightShare}% of goal)
            {milestone.TargetDate &&
              ` · target ${dayjs(milestone.TargetDate).format("MMM D, YYYY")}`}
            {remaining > 0 && ` · ${formatHours(remaining)} left`}
          </p>
        </div>
        <Button variant="subtle" size="sm" onClick={onAddTask}>
          <Plus /> Task
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="subtle"
              size="icon-sm"
              aria-label={`Actions for ${milestone.Title}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> Edit milestone
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isFirst}
              onSelect={() => moveMilestone(milestone.Id, -1)}
            >
              <ArrowUp /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isLast}
              onSelect={() => moveMilestone(milestone.Id, 1)}
            >
              <ArrowDown /> Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {skipped ? (
              <DropdownMenuItem
                onSelect={() =>
                  updateMilestone(milestone.Id, {
                    Status: MilestoneStatus.NotStarted,
                  })
                }
              >
                <Undo2 /> Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  updateMilestone(milestone.Id, {
                    Status: MilestoneStatus.Skipped,
                  });
                  toast.success(
                    "Milestone skipped. It no longer counts toward progress.",
                  );
                }}
              >
                <SkipForward /> Skip milestone
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() =>
                void confirmDelete({
                  itemName: milestone.Title,
                  description: `Its ${tasks.length} task${tasks.length === 1 ? "" : "s"} will be deleted too.`,
                  onConfirm: () => deleteMilestone(milestone.Id),
                  successMessage: "Milestone deleted.",
                })
              }
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex items-center gap-3">
        <ProgressBar value={progress} color={color} className="flex-1" />
        <span className="w-10 text-right text-sm font-medium tabular-nums">
          {progress}%
        </span>
      </div>

      {tasks.length === 0 ? (
        <button
          type="button"
          onClick={onAddTask}
          className="w-full rounded-lg border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          No tasks yet. Add the first one.
        </button>
      ) : (
        <ul className="divide-y rounded-lg border">
          {tasks.map((task) => (
            <GoalTaskRow
              key={task.Id}
              task={task}
              tasksById={tasksById}
              nextEntry={nextEntries.get(task.Id)}
              onEdit={() => onEditTask(task)}
            />
          ))}
        </ul>
      )}
      <ConfirmDialog {...dialogProps} />
    </section>
  );
}

interface GoalTaskRowProps {
  task: GoalTask;
  tasksById: Map<string, GoalTask>;
  nextEntry: ScheduleEntry | undefined;
  onEdit: () => void;
}

function GoalTaskRow({ task, tasksById, nextEntry, onEdit }: GoalTaskRowProps) {
  const setTaskStatus = usePlannerStore((state) => state.setTaskStatus);
  const deleteTask = usePlannerStore((state) => state.deleteTask);
  const done = task.Status === GoalTaskStatus.Done;
  const skipped = task.Status === GoalTaskStatus.Skipped;
  const waitingOn = task.DependsOnIds.map((id) => tasksById.get(id)).filter(
    (dep): dep is GoalTask => !!dep && dep.Status === GoalTaskStatus.Todo,
  );
  const priority = TASK_PRIORITY.get(task.Priority);
  const overdue =
    !done &&
    !skipped &&
    task.DueDate &&
    dayjs(task.DueDate).isBefore(dayjs(), "day");

  return (
    <li className="flex items-start gap-3 p-3">
      <Checkbox
        className="mt-0.5"
        checked={done}
        disabled={skipped}
        aria-label={
          done ? `Mark ${task.Title} as not done` : `Complete ${task.Title}`
        }
        onCheckedChange={(checked) => {
          setTaskStatus(
            task.Id,
            checked ? GoalTaskStatus.Done : GoalTaskStatus.Todo,
          );
          if (checked) toast.success(`"${task.Title}" completed.`);
        }}
      />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p
          className={cn(
            "text-sm font-medium",
            (done || skipped) && "text-muted-foreground line-through",
          )}
        >
          {task.Title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" /> {formatHours(task.EstimatedMinutes)}
          </span>
          {task.Steps.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListChecks className="size-3" />
              {task.Steps.filter((step) => step.Done).length}/
              {task.Steps.length} steps
            </span>
          )}
          {task.DueDate && (
            <span className={cn(overdue && "font-medium text-destructive")}>
              Due {dayjs(task.DueDate).format("MMM D")}
            </span>
          )}
          {task.PreferredTime && (
            <span>{PREFERRED_TIMES.get(task.PreferredTime)?.label}</span>
          )}
          {nextEntry && !done && (
            <span className="inline-flex items-center gap-1 text-primary">
              <CalendarCheck2 className="size-3" />
              {dayjs(nextEntry.Date).format("ddd, MMM D")} ·{" "}
              {formatClock(nextEntry.StartTime)}
            </span>
          )}
          {waitingOn.length > 0 && !done && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Link2 className="size-3" />
              Waiting on {waitingOn.map((dep) => dep.Title).join(", ")}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {priority && !done && (
          <Badge variant={priority.variant} className="hidden sm:inline-flex">
            {priority.label}
          </Badge>
        )}
        {skipped && (
          <Badge variant={GOAL_TASK_STATUS.get(task.Status)?.variant}>
            {GOAL_TASK_STATUS.get(task.Status)?.label}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Actions for ${task.Title}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> Edit task
            </DropdownMenuItem>
            {!done && (
              <DropdownMenuItem
                onSelect={() => setTaskStatus(task.Id, GoalTaskStatus.Done)}
              >
                <CheckCircle2 /> Mark done
              </DropdownMenuItem>
            )}
            {skipped ? (
              <DropdownMenuItem
                onSelect={() => setTaskStatus(task.Id, GoalTaskStatus.Todo)}
              >
                <Undo2 /> Restore
              </DropdownMenuItem>
            ) : (
              !done && (
                <DropdownMenuItem
                  onSelect={() => {
                    setTaskStatus(task.Id, GoalTaskStatus.Skipped);
                    toast.success("Task skipped.");
                  }}
                >
                  <SkipForward /> Skip
                </DropdownMenuItem>
              )
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                deleteTask(task.Id);
                toast.success("Task deleted.");
              }}
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
