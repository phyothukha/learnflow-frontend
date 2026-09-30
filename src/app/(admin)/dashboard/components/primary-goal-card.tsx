"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { Flag, Target } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GOAL_HEALTH } from "@/lib/goal-meta";
import { GoalFocus, GoalStatus } from "@/store/server/goals/interface";
import type { PlannerData } from "@/store/client/planner-seed";
import { milestoneProgress, summarizeGoal } from "@/utils/goals";
import { DashboardCard, DashboardCardValue } from "./dashboard-card";

export interface PrimaryGoalCardProps {
  data: PlannerData;
  className?: string;
}

export function PrimaryGoalCard({ data, className }: PrimaryGoalCardProps) {
  const goal =
    data.goals.find(
      (item) =>
        item.Focus === GoalFocus.Primary && item.Status === GoalStatus.Active,
    ) ?? data.goals.find((item) => item.Status === GoalStatus.Active);

  if (!goal) {
    return (
      <DashboardCard title="Primary Goal" icon={Target} className={className}>
        <div className="m-auto flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-sm text-muted-foreground">No active goal yet.</p>
          <Link
            href="/goals"
            className="text-sm font-medium text-primary hover:underline"
          >
            Create a goal
          </Link>
        </div>
      </DashboardCard>
    );
  }

  const summary = summarizeGoal(goal, data.milestones, data.tasks, dayjs());
  const health = GOAL_HEALTH.get(summary.health);
  const next = summary.next;
  const nextProgress = next ? milestoneProgress(next, data.tasks) : 0;

  return (
    <DashboardCard title="Primary Goal" icon={Target} className={className}>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DashboardCardValue className="mt-0">
          {summary.progress}%
        </DashboardCardValue>
        {health && <Badge variant={health.variant}>{health.label}</Badge>}
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{goal.Title}</span>
        {goal.CurrentLevel && goal.TargetLevel
          ? ` · ${goal.CurrentLevel} → ${goal.TargetLevel}`
          : ""}
        {" · "}
        {summary.daysLeft >= 0
          ? `${summary.daysLeft} days left`
          : "Past target date"}
      </p>

      <div className="mt-4 flex flex-1 flex-col gap-4">
        <div className="space-y-1.5">
          <ProgressBar
            value={summary.progress}
            expected={summary.expected}
            color={goal.Color}
          />
          <p className="text-right text-xs text-muted-foreground">
            expected {summary.expected}%
          </p>
        </div>

        {next && (
          <div className="space-y-1.5 rounded-lg bg-muted/60 p-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Flag className="size-3.5 shrink-0" />
                <span className="truncate">
                  Next milestone:{" "}
                  <span className="font-medium text-foreground">
                    {next.Title}
                  </span>
                </span>
              </span>
              <span className="tabular-nums">{nextProgress}%</span>
            </div>
            <ProgressBar
              value={nextProgress}
              color={goal.Color}
              className="h-1.5"
            />
          </div>
        )}
      </div>
      <div className="mt-auto pt-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/goals/${goal.Id}`}>Open goal</Link>
        </Button>
      </div>
    </DashboardCard>
  );
}
