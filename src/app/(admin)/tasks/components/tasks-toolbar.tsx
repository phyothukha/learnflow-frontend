"use client";

import { CalendarDays, List, SquareKanban } from "lucide-react";
import {
  AnimatedTabs,
  AnimatedTabsVariant,
  type AnimatedTab,
} from "@/components/animated-tabs";
import {
  ScheduleFilters,
  type ScheduleFiltersProps,
} from "@/components/schedule-filters";
import { TASK_CATEGORIES, TASK_STATUS, TaskView } from "@/lib/task-meta";
import type { TaskCategory, TaskStatus } from "@/store/server/tasks/interface";

export const ALL_STATUSES = "all";

export type TaskStatusFilter = TaskStatus | typeof ALL_STATUSES;

const VIEW_TABS: AnimatedTab<TaskView>[] = [
  {
    value: TaskView.Kanban,
    title: "Kanban board",
    label: (
      <>
        <SquareKanban className="size-4" />
        <span className="hidden sm:inline">Board</span>
      </>
    ),
  },
  {
    value: TaskView.List,
    title: "List",
    label: (
      <>
        <List className="size-4" />
        <span className="hidden sm:inline">List</span>
      </>
    ),
  },
  {
    value: TaskView.Timeline,
    title: "Timeline",
    label: (
      <>
        <CalendarDays className="size-4" />
        <span className="hidden sm:inline">Timeline</span>
      </>
    ),
  },
];

export interface TaskViewTabsProps {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
}

export function TaskViewTabs({ view, onViewChange }: TaskViewTabsProps) {
  return (
    <AnimatedTabs
      tabs={VIEW_TABS}
      value={view}
      onValueChange={onViewChange}
      variant={AnimatedTabsVariant.Pill}
      tabClassName="px-3 py-1"
    />
  );
}

export interface TaskFiltersProps extends Omit<
  ScheduleFiltersProps<TaskStatusFilter, TaskCategory>,
  "statusTabs" | "categories"
> {
  statusCounts: Map<TaskStatusFilter, number>;
  categoryCounts: Map<TaskCategory, number>;
}

export function TaskFilters({
  statusCounts,
  categoryCounts,
  ...props
}: TaskFiltersProps) {
  const statusTabs: AnimatedTab<TaskStatusFilter>[] = [
    {
      value: ALL_STATUSES,
      label: "All Tasks",
      count: statusCounts.get(ALL_STATUSES) ?? 0,
    },
    ...Array.from(TASK_STATUS, ([value, meta]) => ({
      value,
      label: meta.label,
      count: statusCounts.get(value) ?? 0,
    })),
  ];
  const categories = Array.from(TASK_CATEGORIES, ([value, meta]) => ({
    value,
    label: meta.label,
    color: meta.color,
    count: categoryCounts.get(value) ?? 0,
  }));

  return (
    <ScheduleFilters
      statusTabs={statusTabs}
      categories={categories}
      searchPlaceholder="Search tasks or people"
      {...props}
    />
  );
}
