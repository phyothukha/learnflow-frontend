"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { CalendarSync, SkipForward, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlannerData } from "@/hooks/use-planner-data";
import { RESCHEDULE_KINDS, RescheduleKind } from "@/lib/goal-meta";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  GoalTaskStatus,
  type ScheduleEntry,
} from "@/store/server/goals/interface";
import { formatHours } from "@/utils/format";
import {
  entryMinutes,
  formatClock,
  suggestReschedule,
  toBusyBlocks,
} from "@/utils/scheduler";
import { useTasks } from "../context/tasks-context";

export interface PlannerRescheduleDialogProps {
  entry: ScheduleEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function PlannerRescheduleDialog({
  entry,
  onOpenChange,
}: PlannerRescheduleDialogProps) {
  const data = usePlannerData();
  const { tasks } = useTasks();
  const rescheduleEntry = usePlannerStore((state) => state.rescheduleEntry);
  const setTaskStatus = usePlannerStore((state) => state.setTaskStatus);
  const [picked, setPicked] = useState<RescheduleKind | null>(null);

  const options = useMemo(
    () =>
      entry
        ? suggestReschedule(
            { ...data, busy: toBusyBlocks(tasks), now: dayjs() },
            entry,
          )
        : [],
    [entry, data, tasks],
  );
  const task = data.tasks.find((item) => item.Id === entry?.TaskId);
  const selectedKind =
    picked ?? options.find((option) => option.entry)?.kind ?? null;
  const selected = options.find((option) => option.kind === selectedKind);

  const close = () => {
    setPicked(null);
    onOpenChange(false);
  };

  const confirm = () => {
    if (!entry || !selected?.entry) return;
    rescheduleEntry(entry.Id, selected.entry);
    toast.success(
      `Moved to ${dayjs(selected.entry.Date).format("ddd, MMM D")} at ${formatClock(selected.entry.StartTime)}.`,
    );
    close();
  };

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule missed session</DialogTitle>
          <DialogDescription>
            {task?.Title}
            {entry &&
              ` · ${formatHours(entryMinutes(entry))} originally on ${dayjs(entry.Date).format("ddd, MMM D")}`}
          </DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="New time" className="space-y-2">
          {options.map((option) => {
            const available = !!option.entry;
            const active = option.kind === selectedKind;
            return (
              <button
                key={option.kind}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!available}
                onClick={() => setPicked(option.kind)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50",
                  active && "border-primary bg-primary/5 ring-1 ring-primary",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {option.kind === RescheduleKind.Best && (
                    <Sparkles className="size-4 text-primary" />
                  )}
                  {RESCHEDULE_KINDS.get(option.kind)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {option.entry
                    ? `${dayjs(option.entry.Date).format("ddd, MMM D")} · ${formatClock(option.entry.StartTime)}`
                    : "No free slot"}
                </span>
              </button>
            );
          })}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (task) setTaskStatus(task.Id, GoalTaskStatus.Skipped);
              toast.success("Task skipped.");
              close();
            }}
          >
            <SkipForward /> Skip task
          </Button>
          <Button disabled={!selected?.entry} onClick={confirm}>
            <CalendarSync /> Move session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
