"use client";

import dayjs, { type Dayjs } from "dayjs";
import {
  CalendarSync,
  CheckCircle2,
  CircleX,
  MoreHorizontal,
  Timer,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENTRY_STATUS } from "@/lib/goal-meta";
import { TASK_CATEGORIES } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { TaskStatus, type Task } from "@/store/server/tasks/interface";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  ScheduleEntryStatus,
  type AvailabilityWindow,
  type PlannerSettings,
  type ScheduleEntry,
} from "@/store/server/goals/interface";
import { formatHours, formatTimeRange } from "@/utils/format";
import type { TaskContext } from "@/utils/goals";
import {
  DATE_KEY,
  dayCapacity,
  entryMinutes,
  formatClock,
} from "@/utils/scheduler";

enum BoardItemKind {
  Session = "session",
  Task = "task",
}

interface SessionItem {
  kind: BoardItemKind.Session;
  start: string;
  entry: ScheduleEntry;
}

interface TaskItem {
  kind: BoardItemKind.Task;
  start: string;
  task: Task;
}

type BoardItem = SessionItem | TaskItem;

export interface PlannerWeekBoardProps {
  days: Dayjs[];
  entries: ScheduleEntry[];
  tasks: Task[];
  lookup: Map<string, TaskContext>;
  availability: AvailabilityWindow[];
  settings: PlannerSettings;
  onFocus: (entry: ScheduleEntry) => void;
  onReschedule: (entry: ScheduleEntry) => void;
  onTaskClick: (task: Task) => void;
}

export function PlannerWeekBoard({
  days,
  entries,
  tasks,
  lookup,
  availability,
  settings,
  onFocus,
  onReschedule,
  onTaskClick,
}: PlannerWeekBoardProps) {
  const today = dayjs();

  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid gap-3 md:min-w-[880px] md:grid-cols-7">
        {days.map((day) => {
          const date = day.format(DATE_KEY);
          const dayEntries = entries.filter((entry) => entry.Date === date);
          const items: BoardItem[] = [
            ...dayEntries.map((entry) => ({
              kind: BoardItemKind.Session as const,
              start: entry.StartTime,
              entry,
            })),
            ...tasks
              .filter((task) => dayjs(task.StartAt).isSame(day, "day"))
              .map((task) => ({
                kind: BoardItemKind.Task as const,
                start: dayjs(task.StartAt).format("HH:mm"),
                task,
              })),
          ].sort((a, b) => a.start.localeCompare(b.start));
          const booked = dayEntries
            .filter((entry) => entry.Status !== ScheduleEntryStatus.Rescheduled)
            .reduce((sum, entry) => sum + entryMinutes(entry), 0);
          const capacity = dayCapacity(day, availability, settings);
          const rest = settings.RestDays.includes(day.day());
          const isToday = day.isSame(today, "day");

          return (
            <section
              key={date}
              aria-label={day.format("dddd, MMMM D")}
              className={cn(
                "flex min-h-40 flex-col gap-2 rounded-xl border bg-card p-2.5 shadow-xs",
                isToday && "border-primary/50 ring-1 ring-primary/30",
                day.isBefore(today, "day") && "bg-muted/30",
              )}
            >
              <header className="space-y-1.5 px-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isToday && "text-primary",
                    )}
                  >
                    {day.format("ddd D")}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {rest
                      ? "Rest"
                      : `${formatHours(booked)} / ${formatHours(capacity)}`}
                  </span>
                </div>
                {!rest && capacity > 0 && (
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full bg-primary/70",
                        booked > capacity && "bg-destructive",
                      )}
                      style={{
                        width: `${Math.min(100, (booked / capacity) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </header>

              {items.map((item) =>
                item.kind === BoardItemKind.Session ? (
                  <EntryCard
                    key={item.entry.Id}
                    entry={item.entry}
                    info={lookup.get(item.entry.TaskId)}
                    onFocus={() => onFocus(item.entry)}
                    onReschedule={() => onReschedule(item.entry)}
                  />
                ) : (
                  <TaskCard
                    key={item.task.Id}
                    task={item.task}
                    onClick={() => onTaskClick(item.task)}
                  />
                ),
              )}

              {items.length === 0 && (
                <p className="m-auto px-2 text-center text-xs text-muted-foreground">
                  {rest ? "Rest day" : capacity ? "Free" : "No availability"}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const category = TASK_CATEGORIES.get(task.Category);
  const done = task.Status === TaskStatus.Done;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border border-l-4 border-dashed bg-background p-2 text-left text-xs transition-colors hover:bg-muted/50",
        done && "opacity-60",
      )}
      style={{ borderLeftColor: category?.color, borderLeftStyle: "solid" }}
    >
      <p className="text-muted-foreground tabular-nums">
        {formatTimeRange(task.StartAt, task.EndAt)}
      </p>
      <p
        className={cn(
          "mt-0.5 line-clamp-2 text-[13px] leading-snug font-medium",
          done && "line-through",
        )}
      >
        {task.Title}
      </p>
      <p className="mt-1 truncate text-muted-foreground">
        {category?.label} task
      </p>
    </button>
  );
}

interface EntryCardProps {
  entry: ScheduleEntry;
  info: TaskContext | undefined;
  onFocus: () => void;
  onReschedule: () => void;
}

function EntryCard({ entry, info, onFocus, onReschedule }: EntryCardProps) {
  const setEntryStatus = usePlannerStore((state) => state.setEntryStatus);
  const deleteEntry = usePlannerStore((state) => state.deleteEntry);
  const status = ENTRY_STATUS.get(entry.Status);
  const planned = entry.Status === ScheduleEntryStatus.Planned;
  const missed = entry.Status === ScheduleEntryStatus.Missed;
  const muted =
    entry.Status === ScheduleEntryStatus.Rescheduled ||
    entry.Status === ScheduleEntryStatus.Done;

  return (
    <article
      className={cn(
        "group relative rounded-lg border border-l-4 bg-background p-2 text-xs",
        muted && "opacity-60",
        missed && "border-destructive/40 bg-destructive/5",
      )}
      style={{ borderLeftColor: info?.goal.Color }}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-muted-foreground tabular-nums">
          {formatClock(entry.StartTime)} – {formatClock(entry.EndTime)}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="-mt-0.5 -mr-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Actions for ${info?.task.Title ?? "session"}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {planned && (
              <DropdownMenuItem onSelect={onFocus}>
                <Timer /> Start focus
              </DropdownMenuItem>
            )}
            {(planned || missed) && (
              <DropdownMenuItem
                onSelect={() =>
                  setEntryStatus(entry.Id, ScheduleEntryStatus.Done)
                }
              >
                <CheckCircle2 /> Mark done
              </DropdownMenuItem>
            )}
            {planned && (
              <DropdownMenuItem
                onSelect={() =>
                  setEntryStatus(entry.Id, ScheduleEntryStatus.Missed)
                }
              >
                <CircleX /> Mark missed
              </DropdownMenuItem>
            )}
            {missed && (
              <DropdownMenuItem onSelect={onReschedule}>
                <CalendarSync /> Reschedule
              </DropdownMenuItem>
            )}
            {entry.Status === ScheduleEntryStatus.Done && (
              <DropdownMenuItem
                onSelect={() =>
                  setEntryStatus(entry.Id, ScheduleEntryStatus.Planned)
                }
              >
                <CircleX /> Undo done
              </DropdownMenuItem>
            )}
            {planned && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => deleteEntry(entry.Id)}
                >
                  <Trash2 /> Remove from plan
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p
        className={cn(
          "mt-0.5 line-clamp-2 text-[13px] leading-snug font-medium",
          entry.Status === ScheduleEntryStatus.Done && "line-through",
        )}
      >
        {info?.task.Title ?? "Deleted task"}
      </p>
      <p className="mt-1 truncate text-muted-foreground">
        {info?.goal.Title}
        {entry.PartCount > 1 && ` · part ${entry.PartIndex}/${entry.PartCount}`}
      </p>
      {!planned && status && (
        <Badge variant={status.variant} className="mt-1.5">
          {status.label}
        </Badge>
      )}
    </article>
  );
}
