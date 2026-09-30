"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { ListChecks, Play } from "lucide-react";
import { toast } from "sonner";
import {
  FocusSessionDialog,
  type FocusTarget,
} from "@/components/focus-session-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/client/planner-store";
import type { PlannerData } from "@/store/client/planner-seed";
import {
  GoalTaskStatus,
  ScheduleEntryStatus,
} from "@/store/server/goals/interface";
import { formatHours } from "@/utils/format";
import { taskLookup } from "@/utils/goals";
import {
  DATE_KEY,
  entryMinutes,
  formatClock,
  rankTasks,
} from "@/utils/scheduler";
import { DashboardCard, DashboardCardValue } from "./dashboard-card";

const TOP_COUNT = 3;

interface FocusItem {
  key: string;
  taskId: string;
  entryId: string | null;
  title: string;
  color: string;
  meta: string;
  minutes: number;
  done: boolean;
}

export interface TodayFocusCardProps {
  data: PlannerData;
  className?: string;
}

export function TodayFocusCard({ data, className }: TodayFocusCardProps) {
  const setEntryStatus = usePlannerStore((state) => state.setEntryStatus);
  const setTaskStatus = usePlannerStore((state) => state.setTaskStatus);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const now = dayjs();
  const today = now.format(DATE_KEY);
  const lookup = taskLookup(data.goals, data.milestones, data.tasks);

  const scheduled: FocusItem[] = data.entries
    .filter(
      (entry) =>
        entry.Date === today &&
        (entry.Status === ScheduleEntryStatus.Planned ||
          entry.Status === ScheduleEntryStatus.Done),
    )
    .sort((a, b) => a.StartTime.localeCompare(b.StartTime))
    .flatMap((entry) => {
      const info = lookup.get(entry.TaskId);
      if (!info) return [];
      return [
        {
          key: entry.Id,
          taskId: entry.TaskId,
          entryId: entry.Id,
          title: info.task.Title,
          color: info.goal.Color,
          meta: `${formatClock(entry.StartTime)} · ${formatHours(entryMinutes(entry))}`,
          minutes: entryMinutes(entry),
          done: entry.Status === ScheduleEntryStatus.Done,
        },
      ];
    });

  const suggested: FocusItem[] = rankTasks({ ...data, now })
    .ranked.slice(0, Math.max(0, TOP_COUNT - scheduled.length))
    .map(({ task, goal }) => ({
      key: task.Id,
      taskId: task.Id,
      entryId: null,
      title: task.Title,
      color: goal.Color,
      meta: `Suggested · ${formatHours(task.EstimatedMinutes)}`,
      minutes: Math.min(task.EstimatedMinutes, 50),
      done: false,
    }));

  const items = [...scheduled, ...suggested].slice(0, TOP_COUNT);
  const doneCount = items.filter((item) => item.done).length;

  const toggle = (item: FocusItem, checked: boolean) => {
    if (item.entryId)
      setEntryStatus(
        item.entryId,
        checked ? ScheduleEntryStatus.Done : ScheduleEntryStatus.Planned,
      );
    else
      setTaskStatus(
        item.taskId,
        checked ? GoalTaskStatus.Done : GoalTaskStatus.Todo,
      );
    if (checked) toast.success(`"${item.title}" done.`);
  };

  return (
    <DashboardCard
      title="Today's Focus"
      icon={ListChecks}
      className={className}
    >
      <DashboardCardValue>
        {doneCount}
        <span className="text-base font-normal text-muted-foreground">
          /{items.length} done
        </span>
      </DashboardCardValue>
      {items.length === 0 ? (
        <p className="m-auto py-6 text-center text-sm text-muted-foreground">
          Nothing planned today. Enjoy the rest!
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-3 rounded-lg border border-l-4 p-2.5"
              style={{ borderLeftColor: item.color }}
            >
              <Checkbox
                checked={item.done}
                aria-label={`Mark ${item.title} done`}
                onCheckedChange={(checked) => toggle(item, checked === true)}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    item.done && "text-muted-foreground line-through",
                  )}
                >
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.meta}</p>
              </div>
              {!item.done && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Start focus on ${item.title}`}
                  onClick={() =>
                    setFocus({
                      taskId: item.taskId,
                      entryId: item.entryId,
                      title: item.title,
                      minutes: item.minutes,
                    })
                  }
                >
                  <Play />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/tasks?view=planner">Open planner</Link>
        </Button>
      </div>
      <FocusSessionDialog
        target={focus}
        onOpenChange={(open) => !open && setFocus(null)}
      />
    </DashboardCard>
  );
}
