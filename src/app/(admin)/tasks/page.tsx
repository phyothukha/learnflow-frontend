"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { TaskView } from "@/lib/task-meta";
import type { TaskCategory } from "@/store/server/tasks/interface";
import { TaskCalendarView } from "./components/task-calendar-view";
import { TaskKanbanView } from "./components/task-kanban-view";
import { TaskListView } from "./components/task-list-view";
import { TasksDialogs } from "./components/tasks-dialogs";
import {
  ALL_STATUSES,
  TaskFilters,
  TaskViewTabs,
  type TaskStatusFilter,
} from "./components/tasks-toolbar";
import TasksProvider, { useTasks } from "./context/tasks-context";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.SCHEDULE_VIEW);

  useEffect(() => {
    if (sessionStatus === "authenticated" && !canView)
      router.replace("/forbidden");
  }, [sessionStatus, canView, router]);

  if (sessionStatus !== "authenticated" || !canView) return null;

  return (
    <TasksProvider>
      <TasksContent />
      <TasksDialogs />
    </TasksProvider>
  );
}

function TasksContent() {
  const { tasks, openCreate } = useTasks();
  const [view, setView] = useState(TaskView.Timeline);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatusFilter>(ALL_STATUSES);
  const [hiddenCategories, setHiddenCategories] = useState<Set<TaskCategory>>(
    () => new Set(),
  );

  const query = search.trim().toLowerCase();
  const searched = tasks.filter(
    (task) =>
      !query ||
      task.Title.toLowerCase().includes(query) ||
      task.Assignee.Name.toLowerCase().includes(query),
  );
  const visible = searched.filter(
    (task) => !hiddenCategories.has(task.Category),
  );
  const filtered =
    status === ALL_STATUSES
      ? visible
      : visible.filter((task) => task.Status === status);

  const statusCounts = new Map<TaskStatusFilter, number>([
    [ALL_STATUSES, visible.length],
    ...Array.from(
      Map.groupBy(visible, (task) => task.Status),
      ([key, group]) => [key, group.length] as const,
    ),
  ]);
  const categoryCounts = new Map(
    Array.from(
      Map.groupBy(searched, (task) => task.Category),
      ([key, group]) => [key, group.length] as const,
    ),
  );

  const toggleCategory = (category: TaskCategory) =>
    setHiddenCategories((current) => {
      const next = new Set(current);
      if (!next.delete(category)) next.add(category);
      return next;
    });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
      <PageHeader
        title="Tasks"
        description="Plan, track and schedule your tasks by board, list or timeline"
        actions={
          <>
            <TaskViewTabs view={view} onViewChange={setView} />
            <Button onClick={() => openCreate()} aria-label="New task">
              <Plus />
              New task
            </Button>
          </>
        }
      />
      <div className="schedule-card">
        <TaskFilters
          status={status}
          onStatusChange={setStatus}
          statusCounts={statusCounts}
          search={search}
          onSearchChange={setSearch}
          hiddenCategories={hiddenCategories}
          onToggleCategory={toggleCategory}
          onShowAllCategories={() => setHiddenCategories(new Set())}
          categoryCounts={categoryCounts}
        />
        {view === TaskView.Kanban && <TaskKanbanView tasks={filtered} />}
        {view === TaskView.List && <TaskListView tasks={filtered} />}
        {view === TaskView.Timeline && <TaskCalendarView tasks={filtered} />}
      </div>
    </div>
  );
}
