"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import {
  CalendarDays,
  CalendarSync,
  Check,
  Flag,
  Target,
  Timer,
  Undo2,
} from "lucide-react";
import { GoalStepChecklist } from "@/components/goal-step-checklist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { ENTRY_STATUS } from "@/lib/goal-meta";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  ScheduleEntryStatus,
  type ScheduleEntry,
} from "@/store/server/goals/interface";
import { formatHours } from "@/utils/format";
import type { TaskContext } from "@/utils/goals";
import { entryMinutes, formatClock } from "@/utils/scheduler";

export interface PlannerSessionPopoverProps {
  entry: ScheduleEntry;
  context: TaskContext;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  onFocus: (entry: ScheduleEntry) => void;
  onReschedule: (entry: ScheduleEntry) => void;
}

export function PlannerSessionPopover({
  entry,
  context,
  children,
  side = "right",
  onFocus,
  onReschedule,
}: PlannerSessionPopoverProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const updateTask = usePlannerStore((state) => state.updateTask);
  const setEntryStatus = usePlannerStore((state) => state.setEntryStatus);
  const { goal, milestone, task } = context;
  const status = ENTRY_STATUS.get(entry.Status);
  const done = entry.Status === ScheduleEntryStatus.Done;
  const doneSteps = task.Steps.filter((step) => step.Done).length;

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={isMobile ? "bottom" : side}
        align={isMobile ? "center" : "start"}
        className="w-80 space-y-4 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/goals/${goal.Id}`}
            className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Target
              className="size-3.5 shrink-0"
              style={{ color: goal.Color }}
            />
            <span className="truncate">
              {goal.Title}
              <span className="inline-flex items-center gap-1">
                {" · "}
                <Flag className="size-3" /> {milestone.Title}
              </span>
            </span>
          </Link>
          {status && <Badge variant={status.variant}>{status.label}</Badge>}
        </div>

        <div className="space-y-1">
          <p className="leading-snug font-semibold">{task.Title}</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            {dayjs(entry.Date).format("ddd, DD MMM")} ·{" "}
            {formatClock(entry.StartTime)} – {formatClock(entry.EndTime)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatHours(entryMinutes(entry))} session
            {entry.PartCount > 1 &&
              ` · part ${entry.PartIndex} of ${entry.PartCount}`}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="planner-label">Steps</span>
            {task.Steps.length > 0 && (
              <span className="text-muted-foreground tabular-nums">
                {doneSteps}/{task.Steps.length}
              </span>
            )}
          </div>
          <GoalStepChecklist
            steps={task.Steps}
            onChange={(Steps) => updateTask(task.Id, { Steps })}
            className="-mx-1.5"
          />
        </div>

        <div className="flex items-center gap-2">
          {entry.Status === ScheduleEntryStatus.Missed ? (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => run(() => onReschedule(entry))}
            >
              <CalendarSync /> Reschedule
            </Button>
          ) : (
            <Button
              size="sm"
              variant={done ? "subtle" : "default"}
              className="flex-1"
              onClick={() =>
                setEntryStatus(
                  entry.Id,
                  done ? ScheduleEntryStatus.Planned : ScheduleEntryStatus.Done,
                )
              }
            >
              {done ? <Undo2 /> : <Check />}
              {done ? "Undo done" : "Mark done"}
            </Button>
          )}
          {!done && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => run(() => onFocus(entry))}
            >
              <Timer /> Focus
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
