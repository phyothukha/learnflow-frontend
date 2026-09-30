"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { CalendarEventContent } from "@/components/calendar-time-grid";
import { CalendarView } from "@/components/calendar-view";
import { TASK_CATEGORIES } from "@/lib/task-meta";
import { TaskStatus, type Task } from "@/store/server/tasks/interface";
import { CalendarMode } from "@/utils/calendar";
import { useTasks } from "../context/tasks-context";
import { TaskAssigneeAvatar } from "./task-assignee-avatar";
import { TaskDetailPopover } from "./task-detail-popover";

export interface TaskCalendarViewProps {
  tasks: Task[];
}

export function TaskCalendarView({ tasks }: TaskCalendarViewProps) {
  const { updateTask, openCreate } = useTasks();
  const [mode, setMode] = useState(CalendarMode.Week);
  const [cursor, setCursor] = useState(() => dayjs().startOf("day"));

  return (
    <CalendarView
      mode={mode}
      onModeChange={setMode}
      cursor={cursor}
      onCursorChange={setCursor}
      events={tasks}
      getColor={(task) => TASK_CATEGORIES.get(task.Category)?.color}
      isMuted={(task) => task.Status === TaskStatus.Done}
      renderPopover={(task, trigger, side) => (
        <TaskDetailPopover task={task} side={side}>
          {trigger}
        </TaskDetailPopover>
      )}
      renderContent={(task, state) => (
        <CalendarEventContent
          title={task.Title}
          {...state}
          leading={
            <TaskAssigneeAvatar
              assignee={task.Assignee}
              className="size-5 text-[9px]"
            />
          }
        />
      )}
      onEventChange={(task, range) => {
        updateTask(task.Id, range);
        toast.success("Task rescheduled.");
      }}
      onCreateAt={(start) =>
        openCreate({
          StartAt: start.toISOString(),
          EndAt: start.add(1, "hour").toISOString(),
        })
      }
      createHint="Click an empty slot to add a task"
    />
  );
}
