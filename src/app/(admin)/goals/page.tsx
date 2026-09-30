"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Plus, Target } from "lucide-react";
import { AnimatedTabs, AnimatedTabsVariant } from "@/components/animated-tabs";
import { DataTableEmptyState } from "@/components/data-table-empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { usePageAccess } from "@/hooks/use-page-access";
import { usePlannerHydration } from "@/hooks/use-planner-hydration";
import { GOAL_STATUS } from "@/lib/goal-meta";
import { PERMISSIONS } from "@/lib/permissions";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  GoalFocus,
  GoalStatus,
  type Goal,
} from "@/store/server/goals/interface";
import { summarizeGoal } from "@/utils/goals";
import { GoalCard } from "./components/goal-card";
import { GoalFormDialog } from "./components/goal-form-dialog";

const ALL_GOALS = "all";
type GoalFilter = GoalStatus | typeof ALL_GOALS;

const FOCUS_ORDER = new Map<GoalFocus, number>([
  [GoalFocus.Primary, 0],
  [GoalFocus.Secondary, 1],
  [GoalFocus.None, 2],
]);

export default function GoalsPage() {
  const allowed = usePageAccess(PERMISSIONS.SCHEDULE_VIEW);
  const hydrated = usePlannerHydration();
  if (!allowed || !hydrated) return null;
  return <GoalsContent />;
}

function GoalsContent() {
  const goals = usePlannerStore((state) => state.goals);
  const milestones = usePlannerStore((state) => state.milestones);
  const tasks = usePlannerStore((state) => state.tasks);
  const [filter, setFilter] = useState<GoalFilter>(GoalStatus.Active);
  const [dialog, setDialog] = useState<{ open: boolean; goal: Goal | null }>({
    open: false,
    goal: null,
  });

  const now = dayjs();
  const summaries = goals
    .filter((goal) => filter === ALL_GOALS || goal.Status === filter)
    .sort(
      (a, b) =>
        (FOCUS_ORDER.get(a.Focus) ?? 0) - (FOCUS_ORDER.get(b.Focus) ?? 0) ||
        a.TargetDate.localeCompare(b.TargetDate),
    )
    .map((goal) => summarizeGoal(goal, milestones, tasks, now));

  const counts = new Map<GoalFilter, number>([[ALL_GOALS, goals.length]]);
  for (const goal of goals)
    counts.set(goal.Status, (counts.get(goal.Status) ?? 0) + 1);

  const tabs = [
    ...Array.from(GOAL_STATUS, ([value, meta]) => ({
      value: value as GoalFilter,
      label: meta.label,
      count: counts.get(value) ?? 0,
    })),
    { value: ALL_GOALS as GoalFilter, label: "All", count: goals.length },
  ];

  const openCreate = () => setDialog({ open: true, goal: null });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Goals"
        description="Long-term goals broken into weighted milestones and tasks"
        actions={
          <Button onClick={openCreate}>
            <Plus /> New goal
          </Button>
        }
      />
      <div className="overflow-x-auto">
        <AnimatedTabs
          tabs={tabs}
          value={filter}
          onValueChange={setFilter}
          variant={AnimatedTabsVariant.Pill}
        />
      </div>

      {summaries.length === 0 ? (
        <div className="planner-panel flex min-h-80">
          <DataTableEmptyState
            icon={Target}
            title="No goals here"
            description="Create a goal and LearnFlow will plan the work for you."
            action={
              <Button onClick={openCreate}>
                <Plus /> New goal
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map((summary) => (
            <GoalCard
              key={summary.goal.Id}
              summary={summary}
              onEdit={() => setDialog({ open: true, goal: summary.goal })}
            />
          ))}
        </div>
      )}

      <GoalFormDialog
        open={dialog.open}
        goal={dialog.goal}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
      />
    </div>
  );
}
