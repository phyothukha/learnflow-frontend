"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import {
  CalendarClock,
  CalendarSync,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  Link2,
  ListTodo,
  MoreHorizontal,
  Sparkles,
  Timer,
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  FocusSessionDialog,
  type FocusTarget,
} from "@/components/focus-session-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { usePlannerData } from "@/hooks/use-planner-data";
import { usePlannerHydration } from "@/hooks/use-planner-hydration";
import { TASK_PRIORITY } from "@/lib/task-meta";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  GoalTaskStatus,
  ScheduleEntryStatus,
  type ScheduleEntry,
} from "@/store/server/goals/interface";
import type { Task } from "@/store/server/tasks/interface";
import { startOfWeek, weekDays } from "@/utils/calendar";
import { formatHours } from "@/utils/format";
import { taskLookup, weekStats } from "@/utils/goals";
import {
  dailyLimit,
  entryMinutes,
  formatClock,
  rankTasks,
} from "@/utils/scheduler";
import { PlannerAvailabilitySheet } from "./planner-availability-sheet";
import { PlannerPreviewDialog } from "./planner-preview-dialog";
import { PlannerRescheduleDialog } from "./planner-reschedule-dialog";
import { PlannerWeekBoard } from "./planner-week-board";

export interface TaskPlannerViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskPlannerView(props: TaskPlannerViewProps) {
  const hydrated = usePlannerHydration();
  if (!hydrated) return null;
  return <PlannerContent {...props} />;
}

function PlannerContent({ tasks, onTaskClick }: TaskPlannerViewProps) {
  const data = usePlannerData();
  const clearUpcoming = usePlannerStore((state) => state.clearUpcoming);
  const resetDemo = usePlannerStore((state) => state.resetDemo);
  const { confirm, dialogProps } = useConfirmDialog();
  const today = dayjs();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<ScheduleEntry | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);

  const days = weekDays(weekStart);
  const weekEnd = days[6];
  const isCurrentWeek = weekStart.isSame(startOfWeek(today), "day");
  const canGenerate = !weekEnd.isBefore(today, "day");
  const generateFrom = weekStart.isBefore(today, "day")
    ? today.startOf("day")
    : weekStart;

  const lookup = taskLookup(data.goals, data.milestones, data.tasks);
  const stats = weekStats(weekStart, data.entries, data.sessions);
  const { ranked, blocked } = rankTasks({ ...data, now: today });
  const missed = data.entries
    .filter(
      (entry) =>
        entry.Status === ScheduleEntryStatus.Missed &&
        lookup.get(entry.TaskId)?.task.Status === GoalTaskStatus.Todo,
    )
    .sort((a, b) => b.Date.localeCompare(a.Date));

  const openFocus = (entry: ScheduleEntry) =>
    setFocus({
      taskId: entry.TaskId,
      entryId: entry.Id,
      title: lookup.get(entry.TaskId)?.task.Title ?? "Focus",
      minutes: entryMinutes(entry),
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="planner-panel flex flex-wrap items-center justify-between gap-3 sm:p-4">
        <div className="flex items-center gap-1">
          <Button
            variant="subtle"
            size="icon-sm"
            aria-label="Previous week"
            onClick={() =>
              setWeekStart((current) => current.subtract(7, "day"))
            }
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="subtle"
            size="icon-sm"
            aria-label="Next week"
            onClick={() => setWeekStart((current) => current.add(7, "day"))}
          >
            <ChevronRight />
          </Button>
          <div className="ml-2 min-w-0">
            <h2 className="font-semibold">
              {weekStart.format("MMM D")} – {weekEnd.format("MMM D, YYYY")}
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatHours(stats.plannedMinutes)} planned ·{" "}
              {formatHours(stats.actualMinutes)} studied ·{" "}
              {stats.completionRate}% done · limit{" "}
              {formatHours(dailyLimit(data.settings))}/day
            </p>
          </div>
          {!isCurrentWeek && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekStart(startOfWeek(today))}
            >
              This week
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="subtle" onClick={() => setAvailabilityOpen(true)}>
            <CalendarClock /> Availability
          </Button>
          <Button disabled={!canGenerate} onClick={() => setPreviewOpen(true)}>
            <Sparkles /> Generate plan
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="subtle"
                size="icon"
                aria-label="More planner actions"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onSelect={() =>
                  void confirm({
                    title: "Clear upcoming sessions?",
                    description:
                      "Planned sessions from today onward are removed. Done and missed history is kept.",
                    confirmText: "Clear",
                    icon: CalendarX2,
                    onConfirm: clearUpcoming,
                    successMessage: "Upcoming sessions cleared.",
                  })
                }
              >
                <CalendarX2 /> Clear upcoming
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  void confirm({
                    title: "Reset demo data?",
                    description:
                      "Goals, tasks, availability, sessions and reviews go back to the sample data.",
                    confirmText: "Reset",
                    icon: DatabaseZap,
                    onConfirm: resetDemo,
                    successMessage: "Demo data restored.",
                  })
                }
              >
                <DatabaseZap /> Reset demo data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PlannerWeekBoard
        days={days}
        entries={data.entries}
        tasks={tasks}
        lookup={lookup}
        availability={data.availability}
        settings={data.settings}
        onFocus={openFocus}
        onReschedule={setRescheduling}
        onTaskClick={onTaskClick}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="planner-panel space-y-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <CalendarSync className="size-4 text-destructive" /> Missed sessions
            {missed.length > 0 && (
              <Badge variant="status-red">{missed.length}</Badge>
            )}
          </h3>
          {missed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing missed. Keep it up!
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {missed.map((entry) => {
                const info = lookup.get(entry.TaskId);
                return (
                  <li key={entry.Id} className="flex items-center gap-3 p-3">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: info?.goal.Color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {info?.task.Title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dayjs(entry.Date).format("ddd, MMM D")} ·{" "}
                        {formatClock(entry.StartTime)} ·{" "}
                        {formatHours(entryMinutes(entry))}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => setRescheduling(entry)}
                    >
                      Reschedule
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="planner-panel space-y-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <ListTodo className="size-4 text-muted-foreground" /> Up next
            <span className="text-xs font-normal text-muted-foreground">
              unscheduled, by priority score
            </span>
          </h3>
          {ranked.length === 0 && blocked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Every open task already has a session.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {ranked.slice(0, 6).map(({ task, goal, score }) => {
                const priority = TASK_PRIORITY.get(task.Priority);
                return (
                  <li key={task.Id} className="flex items-center gap-3 p-3">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: goal.Color }}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/goals/${goal.Id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {task.Title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatHours(task.EstimatedMinutes)}
                        {task.DueDate &&
                          ` · due ${dayjs(task.DueDate).format("MMM D")}`}
                        {` · score ${Math.round(score)}`}
                      </p>
                    </div>
                    {priority && (
                      <Badge variant={priority.variant}>{priority.label}</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Focus on ${task.Title}`}
                      onClick={() =>
                        setFocus({
                          taskId: task.Id,
                          entryId: null,
                          title: task.Title,
                          minutes: Math.min(task.EstimatedMinutes, 50),
                        })
                      }
                    >
                      <Timer />
                    </Button>
                  </li>
                );
              })}
              {blocked.length > 0 && (
                <li className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                  <Link2 className="size-3.5" />
                  {blocked.length} task{blocked.length === 1 ? " is" : "s are"}{" "}
                  waiting on dependencies
                </li>
              )}
            </ul>
          )}
        </section>
      </div>

      <PlannerPreviewDialog
        open={previewOpen}
        from={generateFrom}
        to={weekEnd}
        onOpenChange={setPreviewOpen}
      />
      <PlannerRescheduleDialog
        entry={rescheduling}
        onOpenChange={(open) => !open && setRescheduling(null)}
      />
      <PlannerAvailabilitySheet
        open={availabilityOpen}
        onOpenChange={setAvailabilityOpen}
      />
      <FocusSessionDialog
        target={focus}
        onOpenChange={(open) => !open && setFocus(null)}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
