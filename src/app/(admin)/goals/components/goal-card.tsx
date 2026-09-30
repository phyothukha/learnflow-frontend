import Link from "next/link";
import dayjs from "dayjs";
import { CalendarClock, Flag, ListChecks, Star } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { GOAL_CATEGORIES, GOAL_HEALTH, GOAL_STATUS } from "@/lib/goal-meta";
import { GoalFocus, GoalStatus } from "@/store/server/goals/interface";
import type { GoalSummary } from "@/utils/goals";
import { GoalActionsMenu } from "./goal-actions-menu";

export interface GoalCardProps {
  summary: GoalSummary;
  onEdit: () => void;
}

export function GoalCard({ summary, onEdit }: GoalCardProps) {
  const { goal, progress, expected, health, next, daysLeft } = summary;
  const category = GOAL_CATEGORIES.get(goal.Category);
  const status = GOAL_STATUS.get(goal.Status);
  const healthMeta = GOAL_HEALTH.get(health);
  const active = goal.Status === GoalStatus.Active;
  const CategoryIcon = category?.icon ?? Flag;

  return (
    <article className="planner-panel group relative flex flex-col gap-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: goal.Color }}
        >
          <CategoryIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            {goal.Focus === GoalFocus.Primary && (
              <Star
                className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
                aria-label="Primary goal"
              />
            )}
            <Link
              href={`/goals/${goal.Id}`}
              className="truncate font-semibold after:absolute after:inset-0 hover:underline"
            >
              {goal.Title}
            </Link>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {category?.label}
            {goal.CurrentLevel && goal.TargetLevel
              ? ` · ${goal.CurrentLevel} → ${goal.TargetLevel}`
              : ""}
          </p>
        </div>
        <div className="relative z-10">
          <GoalActionsMenu goal={goal} onEdit={onEdit} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold tabular-nums">{progress}%</span>
          <span className="text-xs text-muted-foreground">
            expected {expected}%
          </span>
        </div>
        <ProgressBar value={progress} expected={expected} color={goal.Color} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {status && <Badge variant={status.variant}>{status.label}</Badge>}
        {active && healthMeta && (
          <Badge variant={healthMeta.variant}>{healthMeta.label}</Badge>
        )}
      </div>

      <dl className="mt-auto grid gap-1.5 border-t pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Flag className="size-3.5" />
          <dt className="sr-only">Next milestone</dt>
          <dd className="truncate">
            {next ? `Next: ${next.Title}` : "All milestones done"}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <ListChecks className="size-3.5" />
          <dt className="sr-only">Tasks</dt>
          <dd>
            {summary.doneTasks}/{summary.totalTasks} tasks done
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-3.5" />
          <dt className="sr-only">Target date</dt>
          <dd>
            {dayjs(goal.TargetDate).format("MMM D, YYYY")}
            {active &&
              (daysLeft >= 0 ? ` · ${daysLeft} days left` : " · overdue")}
          </dd>
        </div>
      </dl>
    </article>
  );
}
