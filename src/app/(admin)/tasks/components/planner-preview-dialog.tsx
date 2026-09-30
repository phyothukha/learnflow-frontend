"use client";

import { useMemo } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  CalendarPlus,
  CircleSlash,
  Lightbulb,
  Scissors,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { ProgressBar } from "@/components/progress-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { PLAN_RECOMMENDATIONS, UNSCHEDULED_REASONS } from "@/lib/goal-meta";
import { usePlannerStore } from "@/store/client/planner-store";
import { formatHours } from "@/utils/format";
import { taskLookup } from "@/utils/goals";
import {
  entryMinutes,
  formatClock,
  generateSchedule,
  toBusyBlocks,
  type ProposedEntry,
} from "@/utils/scheduler";
import { useTasks } from "../context/tasks-context";

export interface PlannerPreviewDialogProps {
  open: boolean;
  from: Dayjs;
  to: Dayjs;
  onOpenChange: (open: boolean) => void;
}

export function PlannerPreviewDialog({
  open,
  from,
  to,
  onOpenChange,
}: PlannerPreviewDialogProps) {
  const data = usePlannerData();
  const { tasks } = useTasks();
  const applySchedule = usePlannerStore((state) => state.applySchedule);

  const result = useMemo(
    () =>
      open
        ? generateSchedule(
            { ...data, busy: toBusyBlocks(tasks), now: dayjs() },
            from,
            to,
          )
        : null,
    [open, data, tasks, from, to],
  );
  const lookup = taskLookup(data.goals, data.milestones, data.tasks);

  const byDate = new Map<string, ProposedEntry[]>();
  for (const entry of result?.entries ?? [])
    byDate.set(entry.Date, [...(byDate.get(entry.Date) ?? []), entry]);

  const plannedMinutes = (result?.entries ?? []).reduce(
    (sum, entry) => sum + entryMinutes(entry),
    0,
  );
  const usage = result?.capacityMinutes
    ? Math.round((plannedMinutes / result.capacityMinutes) * 100)
    : 0;

  const apply = () => {
    if (!result) return;
    applySchedule(result.entries);
    toast.success(
      `${result.entries.length} session${result.entries.length === 1 ? "" : "s"} added to your plan.`,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Plan preview</DialogTitle>
          <DialogDescription>
            {from.format("MMM D")} – {to.format("MMM D")}. Nothing is saved
            until you apply.
          </DialogDescription>
        </DialogHeader>

        {result && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="planner-label">Sessions</p>
                <p className="text-xl font-semibold tabular-nums">
                  {result.entries.length}
                </p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="planner-label">Planned</p>
                <p className="text-xl font-semibold tabular-nums">
                  {formatHours(plannedMinutes)}
                </p>
              </div>
              <div className="space-y-2 rounded-lg bg-muted/60 p-3">
                <p className="planner-label">Free time used</p>
                <p className="text-xl font-semibold tabular-nums">
                  {usage}%
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    of {formatHours(result.capacityMinutes)}
                  </span>
                </p>
                <ProgressBar value={Math.min(100, usage)} />
              </div>
            </div>

            {result.warnings.map((warning) => (
              <Alert
                key={warning.type}
                className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
              >
                <TriangleAlert />
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription className="text-current/80">
                  {warning.message}
                </AlertDescription>
              </Alert>
            ))}

            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="planner-label flex items-center gap-1.5">
                  <Lightbulb className="size-3.5" /> Suggestions
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {result.recommendations.map((item) => (
                    <li key={item}>{PLAN_RECOMMENDATIONS.get(item)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <p className="planner-label">Proposed sessions</p>
              {byDate.size === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Nothing new to schedule in this period.
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {Array.from(byDate, ([date, entries]) => (
                    <div
                      key={date}
                      className="grid gap-2 p-3 sm:grid-cols-[110px_1fr]"
                    >
                      <p className="text-sm font-medium">
                        {dayjs(date).format("ddd, MMM D")}
                      </p>
                      <ul className="space-y-1.5">
                        {entries.map((entry) => {
                          const info = lookup.get(entry.TaskId);
                          return (
                            <li
                              key={`${entry.TaskId}-${entry.PartIndex}`}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: info?.goal.Color }}
                              />
                              <span className="w-32 shrink-0 text-xs text-muted-foreground tabular-nums">
                                {formatClock(entry.StartTime)} –{" "}
                                {formatClock(entry.EndTime)}
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                {info?.task.Title}
                              </span>
                              {entry.PartCount > 1 && (
                                <Badge variant="outline" className="gap-1">
                                  <Scissors className="size-3" />
                                  {entry.PartIndex}/{entry.PartCount}
                                </Badge>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.unscheduled.length > 0 && (
              <div className="space-y-2">
                <p className="planner-label flex items-center gap-1.5">
                  <CircleSlash className="size-3.5" /> Not scheduled
                </p>
                <ul className="divide-y rounded-lg border">
                  {result.unscheduled.map(({ task, reason }) => (
                    <li
                      key={task.Id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                    >
                      <span className="min-w-0 truncate">{task.Title}</span>
                      <span className="text-xs text-muted-foreground">
                        {UNSCHEDULED_REASONS.get(reason)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="subtle" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!result?.entries.length} onClick={apply}>
            <CalendarPlus /> Apply plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
