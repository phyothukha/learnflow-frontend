"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs, { type Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ProgressBar } from "@/components/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BURNOUT_RISK,
  GOAL_HEALTH,
  REVIEW_MOODS,
  WORKLOAD_ADJUSTMENTS,
} from "@/lib/goal-meta";
import { cn } from "@/lib/utils";
import type { PlannerData } from "@/store/client/planner-seed";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  GoalStatus,
  ReviewMood,
  type WeeklyReview,
} from "@/store/server/goals/interface";
import { startOfWeek } from "@/utils/calendar";
import { formatHours } from "@/utils/format";
import {
  assessBurnout,
  suggestAdjustment,
  summarizeGoal,
  weekStats,
  type WeekStats,
} from "@/utils/goals";
import { DATE_KEY } from "@/utils/scheduler";

export interface WeeklyReviewDialogProps {
  open: boolean;
  data: PlannerData;
  onOpenChange: (open: boolean) => void;
}

export function WeeklyReviewDialog({
  open,
  data,
  onOpenChange,
}: WeeklyReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        {open && (
          <ReviewContent data={data} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ReviewContentProps {
  data: PlannerData;
  onDone: () => void;
}

function ReviewContent({ data, onDone }: ReviewContentProps) {
  const today = dayjs();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const weekKey = weekStart.format(DATE_KEY);
  const existing = data.reviews.find((review) => review.WeekStart === weekKey);
  const stats = weekStats(weekStart, data.entries, data.sessions);
  const burnout = assessBurnout(
    stats,
    data.reviews.filter((review) => review.WeekStart < weekKey),
  );
  const risk = BURNOUT_RISK.get(burnout.risk);
  const isCurrentWeek = weekStart.isSame(startOfWeek(today), "day");
  const activeGoals = data.goals
    .filter((goal) => goal.Status === GoalStatus.Active)
    .map((goal) => summarizeGoal(goal, data.milestones, data.tasks, today));
  const history = [...data.reviews].sort((a, b) =>
    b.WeekStart.localeCompare(a.WeekStart),
  );

  const summary = [
    {
      label: "Studied",
      value: `${formatHours(stats.actualMinutes)} / ${formatHours(stats.plannedMinutes)}`,
    },
    {
      label: "Tasks done",
      value: `${stats.tasksCompleted}/${stats.tasksPlanned}`,
    },
    { label: "Completion", value: `${stats.completionRate}%` },
    { label: "Active days", value: `${stats.consistencyDays}/7` },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Weekly review</DialogTitle>
        <DialogDescription>
          Look back on the week and let LearnFlow adjust next week&apos;s
          workload.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="subtle"
          size="icon-sm"
          aria-label="Previous week"
          onClick={() => setWeekStart((current) => current.subtract(7, "day"))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="subtle"
          size="icon-sm"
          aria-label="Next week"
          disabled={isCurrentWeek}
          onClick={() => setWeekStart((current) => current.add(7, "day"))}
        >
          <ChevronRight />
        </Button>
        <h3 className="ml-2 text-sm font-semibold">
          {weekStart.format("MMM D")} –{" "}
          {weekStart.add(6, "day").format("MMM D, YYYY")}
        </h3>
        {existing && (
          <Badge variant="status-green" className="ml-2">
            Reviewed
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-sm font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="planner-label">Burnout risk</p>
            {risk && <Badge variant={risk.variant}>{risk.label}</Badge>}
          </div>
          {burnout.signals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No warning signs. Your workload looks sustainable.
            </p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {burnout.signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-3">
          <p className="planner-label">Goal health</p>
          {activeGoals.map((goal) => {
            const health = GOAL_HEALTH.get(goal.health);
            return (
              <div key={goal.goal.Id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <Link
                    href={`/goals/${goal.goal.Id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {goal.goal.Title}
                  </Link>
                  {health && (
                    <Badge variant={health.variant}>{health.label}</Badge>
                  )}
                </div>
                <ProgressBar
                  value={goal.progress}
                  expected={goal.expected}
                  color={goal.goal.Color}
                />
              </div>
            );
          })}
        </section>
      </div>

      <ReviewForm
        key={weekKey + (existing?.Id ?? "")}
        weekStart={weekStart}
        stats={stats}
        existing={existing}
        workloadPercent={data.settings.WorkloadPercent}
        onSaved={onDone}
      />

      {history.length > 0 && (
        <section className="space-y-2">
          <p className="planner-label">History</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-3 py-2 font-medium">Week</th>
                  <th className="px-3 py-2 font-medium">Completion</th>
                  <th className="px-3 py-2 font-medium">Studied</th>
                  <th className="px-3 py-2 font-medium">Mood</th>
                  <th className="px-3 py-2 font-medium">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((review) => (
                  <HistoryRow
                    key={review.Id}
                    review={review}
                    onSelect={() => setWeekStart(dayjs(review.WeekStart))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

interface ReviewFormProps {
  weekStart: Dayjs;
  stats: WeekStats;
  existing: WeeklyReview | undefined;
  workloadPercent: number;
  onSaved: () => void;
}

function ReviewForm({
  weekStart,
  stats,
  existing,
  workloadPercent,
  onSaved,
}: ReviewFormProps) {
  const submitReview = usePlannerStore((state) => state.submitReview);
  const [mood, setMood] = useState(existing?.Mood ?? ReviewMood.Normal);
  const [notes, setNotes] = useState(existing?.Notes ?? "");
  const [adjustment, setAdjustment] = useState<number | null>(
    existing?.WorkloadAdjustment ?? null,
  );
  const suggested = suggestAdjustment(stats, mood);
  const applied = adjustment ?? suggested;
  const baseline = workloadPercent - (existing?.WorkloadAdjustment ?? 0);
  const nextWorkload = Math.min(150, Math.max(50, baseline + applied));

  const submit = () => {
    submitReview({
      WeekStart: weekStart.format(DATE_KEY),
      PlannedMinutes: stats.plannedMinutes,
      ActualMinutes: stats.actualMinutes,
      TasksPlanned: stats.tasksPlanned,
      TasksCompleted: stats.tasksCompleted,
      CompletionRate: stats.completionRate,
      ConsistencyDays: stats.consistencyDays,
      Mood: mood,
      Notes: notes.trim() || null,
      WorkloadAdjustment: applied,
    });
    toast.success(`Review saved. Workload is now ${nextWorkload}%.`);
    onSaved();
  };

  return (
    <section className="grid gap-5 rounded-xl border p-4 sm:grid-cols-2">
      <div className="space-y-3">
        <p className="planner-label">How did this week feel?</p>
        <div
          role="radiogroup"
          aria-label="Mood"
          className="grid grid-cols-3 gap-2"
        >
          {Array.from(REVIEW_MOODS, ([value, meta]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mood === value}
              onClick={() => setMood(value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-sm transition-colors hover:bg-muted/60",
                mood === value &&
                  "border-primary bg-primary/5 ring-1 ring-primary",
              )}
            >
              <span className="text-xl" aria-hidden>
                {meta.emoji}
              </span>
              {meta.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-notes">Notes</Label>
          <Textarea
            id="review-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What went well? What got in the way?"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="planner-label">Next week&apos;s workload</p>
        <p className="text-sm text-muted-foreground">
          Based on {stats.completionRate}% completion and a{" "}
          {REVIEW_MOODS.get(mood)?.label.toLowerCase()} week, we suggest{" "}
          <span className="font-medium text-foreground">
            {suggested > 0 ? `+${suggested}` : suggested}%
          </span>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          {WORKLOAD_ADJUSTMENTS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={applied === value}
              onClick={() => setAdjustment(value)}
              className={cn(
                "dashboard-chip tabular-nums",
                applied === value &&
                  "border-primary/40 bg-primary/10 text-primary hover:text-primary",
              )}
            >
              {value > 0 ? `+${value}` : value}%
              {value === suggested && (
                <span className="text-[10px] font-medium uppercase">
                  suggested
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">New daily workload</span>
          <span className="font-semibold tabular-nums">{nextWorkload}%</span>
        </div>
        <Button onClick={submit} className="mt-auto sm:self-end">
          {existing ? "Update review" : "Save review"}
        </Button>
      </div>
    </section>
  );
}

interface HistoryRowProps {
  review: WeeklyReview;
  onSelect: () => void;
}

function HistoryRow({ review, onSelect }: HistoryRowProps) {
  const mood = REVIEW_MOODS.get(review.Mood);
  return (
    <tr>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={onSelect}
          className="font-medium hover:underline"
        >
          {dayjs(review.WeekStart).format("MMM D")}
        </button>
      </td>
      <td className="px-3 py-2 tabular-nums">{review.CompletionRate}%</td>
      <td className="px-3 py-2 tabular-nums">
        {formatHours(review.ActualMinutes)} /{" "}
        {formatHours(review.PlannedMinutes)}
      </td>
      <td className="px-3 py-2">
        {mood?.emoji} {mood?.label}
      </td>
      <td className="px-3 py-2 tabular-nums">
        {review.WorkloadAdjustment > 0 ? "+" : ""}
        {review.WorkloadAdjustment}%
      </td>
    </tr>
  );
}
