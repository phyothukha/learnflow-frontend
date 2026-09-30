"use client";

import { useState, type ReactNode } from "react";
import dayjs from "dayjs";
import {
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { TASK_CATEGORIES, TASK_PRIORITY, TASK_STATUS } from "@/lib/task-meta";
import type { Task, TaskStatus } from "@/store/server/tasks/interface";
import { formatTimeRange } from "@/utils/format";
import { useTasks } from "../context/tasks-context";
import { TaskAssigneeAvatar } from "./task-assignee-avatar";

export interface TaskDetailPopoverProps {
  task: Task;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function TaskDetailPopover({
  task,
  children,
  side = "right",
  align = "start",
}: TaskDetailPopoverProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={isMobile ? "bottom" : side}
        align={isMobile ? "center" : align}
        className="w-80 p-0"
      >
        <TaskDetail task={task} onAction={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

interface DetailFieldProps {
  label: string;
  children: ReactNode;
}

function DetailField({ label, children }: DetailFieldProps) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

interface TaskDetailProps {
  task: Task;
  onAction: () => void;
}

function TaskDetail({ task, onAction }: TaskDetailProps) {
  const { updateTask, openEdit, openDelete } = useTasks();
  const category = TASK_CATEGORIES.get(task.Category);
  const priority = TASK_PRIORITY.get(task.Priority);
  const { Assignee: assignee } = task;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <TaskAssigneeAvatar assignee={assignee} size="lg" />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold">{assignee.Name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {assignee.Phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" />
                {assignee.Phone}
              </span>
            )}
            <span className="inline-flex min-w-0 items-center gap-1">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{assignee.Email}</span>
            </span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <p className="leading-snug font-semibold">{task.Title}</p>
        {task.Description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {task.Description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DetailField label="Category">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: category?.color }}
            />
            {category?.label ?? task.Category}
          </span>
        </DetailField>
        <DetailField label="Priority">
          <Badge variant={priority?.variant}>
            {priority?.label ?? task.Priority}
          </Badge>
        </DetailField>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0" />
          {dayjs(task.StartAt).format("ddd, DD MMM YYYY")} ·{" "}
          {formatTimeRange(task.StartAt, task.EndAt)}
        </p>
        {task.Location && (
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            {task.Location}
          </p>
        )}
      </div>

      {task.Tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {task.Tags.map((tag) => (
            <Badge key={tag} variant="outline" className="font-normal">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select
          value={task.Status}
          onValueChange={(value) =>
            updateTask(task.Id, { Status: value as TaskStatus })
          }
        >
          <SelectTrigger size="sm" className="flex-1" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(TASK_STATUS, ([status, meta]) => (
              <SelectItem key={status} value={status}>
                <span className={`size-2 rounded-full ${meta.dotClass}`} />
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Edit task"
          onClick={() => {
            onAction();
            openEdit(task);
          }}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          aria-label="Delete task"
          onClick={() => {
            onAction();
            openDelete(task);
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
