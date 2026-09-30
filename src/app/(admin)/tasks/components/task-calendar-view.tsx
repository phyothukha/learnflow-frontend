"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Target } from "lucide-react";
import { toast } from "sonner";
import {
  CalendarEventContent,
  type CalendarEvent,
} from "@/components/calendar-time-grid";
import { CalendarView } from "@/components/calendar-view";
import {
  FocusSessionDialog,
  type FocusTarget,
} from "@/components/focus-session-dialog";
import { usePlannerData } from "@/hooks/use-planner-data";
import { usePlannerHydration } from "@/hooks/use-planner-hydration";
import { TASK_CATEGORIES } from "@/lib/task-meta";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  ScheduleEntryStatus,
  type ScheduleEntry,
} from "@/store/server/goals/interface";
import { TaskStatus, type Task } from "@/store/server/tasks/interface";
import { CalendarMode } from "@/utils/calendar";
import { taskLookup, type TaskContext } from "@/utils/goals";
import { DATE_KEY, entryMinutes } from "@/utils/scheduler";
import { useTasks } from "../context/tasks-context";
import { PlannerRescheduleDialog } from "./planner-reschedule-dialog";
import { PlannerSessionPopover } from "./planner-session-popover";
import { TaskAssigneeAvatar } from "./task-assignee-avatar";
import { TaskDetailPopover } from "./task-detail-popover";

enum TimelineItemKind {
  Task = "task",
  Session = "session",
}

interface TaskTimelineItem extends CalendarEvent {
  kind: TimelineItemKind.Task;
  task: Task;
}

interface SessionTimelineItem extends CalendarEvent {
  kind: TimelineItemKind.Session;
  entry: ScheduleEntry;
  context: TaskContext;
}

type TimelineItem = TaskTimelineItem | SessionTimelineItem;

interface SessionSubtitleProps {
  item: SessionTimelineItem;
}

function SessionSubtitle({ item }: SessionSubtitleProps) {
  const { Steps } = item.context.task;
  const missed = item.entry.Status === ScheduleEntryStatus.Missed;
  if (!missed && Steps.length === 0) return null;
  return (
    <span className="truncate text-[11px] text-muted-foreground tabular-nums">
      {missed && <span className="font-medium text-destructive">Missed</span>}
      {missed && Steps.length > 0 && " · "}
      {Steps.length > 0 &&
        `${Steps.filter((step) => step.Done).length}/${Steps.length} steps`}
    </span>
  );
}

export interface TaskCalendarViewProps {
  tasks: Task[];
}

export function TaskCalendarView({ tasks }: TaskCalendarViewProps) {
  const { updateTask, openCreate } = useTasks();
  const hydrated = usePlannerHydration();
  const planner = usePlannerData();
  const moveEntry = usePlannerStore((state) => state.moveEntry);
  const [mode, setMode] = useState(CalendarMode.Week);
  const [cursor, setCursor] = useState(() => dayjs().startOf("day"));
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [rescheduling, setRescheduling] = useState<ScheduleEntry | null>(null);

  const lookup = taskLookup(planner.goals, planner.milestones, planner.tasks);
  const sessions: SessionTimelineItem[] = hydrated
    ? planner.entries.flatMap((entry) => {
        const context = lookup.get(entry.TaskId);
        if (!context || entry.Status === ScheduleEntryStatus.Rescheduled)
          return [];
        return [
          {
            kind: TimelineItemKind.Session,
            Id: `session-${entry.Id}`,
            Title: context.task.Title,
            StartAt: dayjs(`${entry.Date}T${entry.StartTime}`).toISOString(),
            EndAt: dayjs(`${entry.Date}T${entry.EndTime}`).toISOString(),
            entry,
            context,
          },
        ];
      })
    : [];
  const events: TimelineItem[] = [
    ...tasks.map((task) => ({
      kind: TimelineItemKind.Task as const,
      Id: task.Id,
      Title: task.Title,
      StartAt: task.StartAt,
      EndAt: task.EndAt,
      task,
    })),
    ...sessions,
  ];

  const openFocus = (entry: ScheduleEntry) =>
    setFocus({
      taskId: entry.TaskId,
      entryId: entry.Id,
      title: lookup.get(entry.TaskId)?.task.Title ?? "Focus",
      minutes: entryMinutes(entry),
    });

  return (
    <>
      <CalendarView
        mode={mode}
        onModeChange={setMode}
        cursor={cursor}
        onCursorChange={setCursor}
        events={events}
        getColor={(item) =>
          item.kind === TimelineItemKind.Task
            ? TASK_CATEGORIES.get(item.task.Category)?.color
            : item.context.goal.Color
        }
        isMuted={(item) =>
          item.kind === TimelineItemKind.Task
            ? item.task.Status === TaskStatus.Done
            : item.entry.Status === ScheduleEntryStatus.Done
        }
        renderPopover={(item, trigger, side) =>
          item.kind === TimelineItemKind.Task ? (
            <TaskDetailPopover task={item.task} side={side}>
              {trigger}
            </TaskDetailPopover>
          ) : (
            <PlannerSessionPopover
              entry={item.entry}
              context={item.context}
              side={side}
              onFocus={openFocus}
              onReschedule={setRescheduling}
            >
              {trigger}
            </PlannerSessionPopover>
          )
        }
        renderContent={(item, state) =>
          item.kind === TimelineItemKind.Task ? (
            <CalendarEventContent
              title={item.task.Title}
              {...state}
              leading={
                <TaskAssigneeAvatar
                  assignee={item.task.Assignee}
                  className="size-5 text-[9px]"
                />
              }
            />
          ) : (
            <CalendarEventContent
              title={item.Title}
              {...state}
              leading={<Target className="size-3.5 shrink-0" />}
              subtitle={<SessionSubtitle item={item} />}
            />
          )
        }
        onEventChange={(item, range) => {
          if (item.kind === TimelineItemKind.Task) {
            updateTask(item.task.Id, range);
            toast.success("Task rescheduled.");
            return;
          }
          const start = dayjs(range.StartAt);
          const end = dayjs(range.EndAt);
          moveEntry(item.entry.Id, {
            Date: start.format(DATE_KEY),
            StartTime: start.format("HH:mm"),
            EndTime: end.isSame(start, "day") ? end.format("HH:mm") : "23:59",
          });
          toast.success("Study session moved.");
        }}
        onCreateAt={(start) =>
          openCreate({
            StartAt: start.toISOString(),
            EndAt: start.add(1, "hour").toISOString(),
          })
        }
        createHint="Click an empty slot to add a task"
      />
      <PlannerRescheduleDialog
        entry={rescheduling}
        onOpenChange={(open) => !open && setRescheduling(null)}
      />
      <FocusSessionDialog
        target={focus}
        onOpenChange={(open) => !open && setFocus(null)}
      />
    </>
  );
}
