"use client";

import { useState, type CSSProperties } from "react";
import dayjs from "dayjs";
import { Clock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TASK_CATEGORIES, TASK_PRIORITY, TASK_STATUS } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { TaskStatus, type Task } from "@/store/server/tasks/interface";
import { formatTimeRange } from "@/utils/format";
import { useTasks } from "../context/tasks-context";
import { TaskAssigneeAvatar } from "./task-assignee-avatar";
import { TaskDetailPopover } from "./task-detail-popover";

const DRAG_TYPE = "application/x-task-id";

export interface TaskKanbanViewProps {
  tasks: Task[];
}

export function TaskKanbanView({ tasks }: TaskKanbanViewProps) {
  const { updateTask, openCreate } = useTasks();
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [dragging, setDragging] = useState<Task | null>(null);
  const tasksByStatus = Map.groupBy(tasks, (task) => task.Status);

  return (
    <div className="scrollbar-handle min-h-0 flex-1 overflow-x-auto p-4">
      <div className="grid h-full min-w-[1040px] grid-cols-4 gap-4">
        {Array.from(TASK_STATUS, ([status, meta]) => {
          const columnTasks = tasksByStatus.get(status) ?? [];
          return (
            <section
              key={status}
              aria-label={meta.label}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                e.preventDefault();
                setDropTarget(status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node))
                  setDropTarget(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(null);
                setDragging(null);
                const id = e.dataTransfer.getData(DRAG_TYPE);
                if (id) updateTask(id, { Status: status });
              }}
              className={cn(
                "flex min-h-0 flex-col rounded-xl border bg-muted/40 transition-colors duration-200",
                dropTarget === status &&
                  "border-primary/60 bg-primary/5 ring-2 ring-primary/15",
              )}
            >
              <header className="flex items-center gap-2 px-3 py-3">
                <span className={cn("size-2 rounded-full", meta.dotClass)} />
                <h2 className="text-sm font-semibold">{meta.label}</h2>
                <span className="rounded-md bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                  {columnTasks.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-7 text-muted-foreground"
                  aria-label={`Add task to ${meta.label}`}
                  onClick={() => openCreate({ Status: status })}
                >
                  <Plus className="size-4" />
                </Button>
              </header>
              <div className="scrollbar-handle flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-2.5 pb-2.5">
                {columnTasks.map((task) => (
                  <TaskKanbanCard
                    key={task.Id}
                    task={task}
                    isDragging={dragging?.Id === task.Id}
                    onDragStart={() => setDragging(task)}
                    onDragEnd={() => {
                      setDragging(null);
                      setDropTarget(null);
                    }}
                  />
                ))}
                {dropTarget === status &&
                  dragging &&
                  dragging.Status !== status && (
                    <div className="h-24 shrink-0 animate-in rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 duration-200 fade-in-0 zoom-in-95" />
                  )}
                {columnTasks.length === 0 && dropTarget !== status && (
                  <p className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                    Drop tasks here
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

interface TaskKanbanCardProps {
  task: Task;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function TaskKanbanCard({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
}: TaskKanbanCardProps) {
  const category = TASK_CATEGORIES.get(task.Category);
  const priority = TASK_PRIORITY.get(task.Priority);

  return (
    <TaskDetailPopover task={task}>
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_TYPE, task.Id);
          e.dataTransfer.effectAllowed = "move";
          // Let the browser snapshot the card before it fades to a placeholder.
          requestAnimationFrame(onDragStart);
        }}
        onDragEnd={onDragEnd}
        style={{ "--task-color": category?.color } as CSSProperties}
        className={cn(
          "group flex w-full shrink-0 cursor-grab flex-col gap-3 rounded-lg border bg-card p-3 text-left shadow-xs transition-[opacity,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing data-[state=open]:ring-2 data-[state=open]:ring-(--task-color)",
          task.Status === TaskStatus.Done && "opacity-70",
          isDragging &&
            "scale-[0.98] border-dashed opacity-40 shadow-none hover:translate-y-0",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="task-chip inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium text-(--task-color)">
            <span className="size-1.5 rounded-full bg-(--task-color)" />
            {category?.label ?? task.Category}
          </span>
          <Badge variant={priority?.variant}>
            {priority?.label ?? task.Priority}
          </Badge>
        </div>
        <div className="space-y-1">
          <p
            className={cn(
              "text-sm leading-snug font-medium",
              task.Status === TaskStatus.Done &&
                "text-muted-foreground line-through",
            )}
          >
            {task.Title}
          </p>
          {task.Description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {task.Description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Clock className="size-3 shrink-0" />
            <span className="truncate">
              {dayjs(task.StartAt).format("DD MMM")} ·{" "}
              {formatTimeRange(task.StartAt, task.EndAt)}
            </span>
          </span>
          <TaskAssigneeAvatar assignee={task.Assignee} />
        </div>
      </button>
    </TaskDetailPopover>
  );
}
