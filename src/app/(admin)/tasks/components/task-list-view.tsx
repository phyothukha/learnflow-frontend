"use client";

import { useState, type CSSProperties } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { ListTodo, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TASK_CATEGORIES,
  TASK_PRIORITY,
  TASK_PRIORITY_RANK,
  TASK_STATUS,
} from "@/lib/task-meta";
import type { Task, TaskStatus } from "@/store/server/tasks/interface";
import { formatTimeRange } from "@/utils/format";
import { useTasks } from "../context/tasks-context";
import { TaskAssigneeAvatar } from "./task-assignee-avatar";
import { TaskDetailPopover } from "./task-detail-popover";

const STATUS_ORDER = new Map(
  Array.from(TASK_STATUS.keys(), (status, index) => [status, index]),
);

const SORTERS = new Map<string, (a: Task, b: Task) => number>([
  ["Title", (a, b) => a.Title.localeCompare(b.Title)],
  ["Category", (a, b) => a.Category.localeCompare(b.Category)],
  [
    "Status",
    (a, b) =>
      (STATUS_ORDER.get(a.Status) ?? 0) - (STATUS_ORDER.get(b.Status) ?? 0),
  ],
  [
    "Priority",
    (a, b) =>
      (TASK_PRIORITY_RANK.get(a.Priority) ?? 0) -
      (TASK_PRIORITY_RANK.get(b.Priority) ?? 0),
  ],
  ["Assignee", (a, b) => a.Assignee.Name.localeCompare(b.Assignee.Name)],
  ["StartAt", (a, b) => a.StartAt.localeCompare(b.StartAt)],
]);

function sortTasks(tasks: Task[], sorting: SortingState) {
  const [sort] = sorting;
  const compare = SORTERS.get(sort?.id ?? "StartAt") ?? SORTERS.get("StartAt")!;
  const direction = sort?.desc ? -1 : 1;
  return [...tasks].sort((a, b) => compare(a, b) * direction);
}

function TaskRowActions({ task }: { task: Task }) {
  const { updateTask, openEdit, openDelete } = useTasks();

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Status
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={task.Status}
            onValueChange={(value) =>
              updateTask(task.Id, { Status: value as TaskStatus })
            }
          >
            {Array.from(TASK_STATUS, ([status, meta]) => (
              <DropdownMenuRadioItem key={status} value={status}>
                {meta.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openEdit(task)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => openDelete(task)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const columns: ColumnDef<Task, unknown>[] = [
  {
    accessorKey: "Title",
    header: "Task",
    cell: ({ row }) => {
      const task = row.original;
      const color = TASK_CATEGORIES.get(task.Category)?.color;
      return (
        <TaskDetailPopover task={task} side="bottom">
          <button
            type="button"
            style={{ "--task-color": color } as CSSProperties}
            className="flex max-w-full items-center gap-2 rounded-md text-left font-medium hover:text-primary data-[state=open]:text-primary"
          >
            <span className="size-2 shrink-0 rounded-full bg-(--task-color)" />
            <span className="truncate">{task.Title}</span>
          </button>
        </TaskDetailPopover>
      );
    },
  },
  {
    accessorKey: "Category",
    header: "Category",
    cell: ({ row }) =>
      TASK_CATEGORIES.get(row.original.Category)?.label ??
      row.original.Category,
  },
  {
    accessorKey: "Status",
    header: "Status",
    cell: ({ row }) => {
      const meta = TASK_STATUS.get(row.original.Status);
      return (
        <Badge variant={meta?.variant}>
          {meta?.label ?? row.original.Status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "Priority",
    header: "Priority",
    cell: ({ row }) => {
      const meta = TASK_PRIORITY.get(row.original.Priority);
      return (
        <Badge variant={meta?.variant}>
          {meta?.label ?? row.original.Priority}
        </Badge>
      );
    },
  },
  {
    id: "Assignee",
    accessorFn: (task) => task.Assignee.Name,
    header: "Assignee",
    cell: ({ row }) => (
      <span className="flex min-w-0 items-center gap-2">
        <TaskAssigneeAvatar assignee={row.original.Assignee} />
        <span className="truncate">{row.original.Assignee.Name}</span>
      </span>
    ),
  },
  {
    accessorKey: "StartAt",
    header: "Schedule",
    cell: ({ row }) => (
      <span className="flex flex-col text-xs">
        <span className="font-medium">
          {dayjs(row.original.StartAt).format("ddd, DD MMM YYYY")}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {formatTimeRange(row.original.StartAt, row.original.EndAt)}
        </span>
      </span>
    ),
  },
  {
    id: "actions",
    enableSorting: false,
    header: "",
    size: 56,
    cell: ({ row }) => <TaskRowActions task={row.original} />,
  },
];

export interface TaskListViewProps {
  tasks: Task[];
}

export function TaskListView({ tasks }: TaskListViewProps) {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const sorted = sortTasks(tasks, sorting);
  const pageCount = Math.max(1, Math.ceil(sorted.length / limit));
  const currentPage = Math.min(page, pageCount - 1);
  const rows = sorted.slice(currentPage * limit, (currentPage + 1) * limit);

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(task) => task.Id}
      showToolbar={false}
      showCheckbox={false}
      page={currentPage}
      total={sorted.length}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={(value) => {
        setLimit(value);
        setPage(0);
      }}
      sorting={sorting}
      onSortingChange={(updater) => {
        setSorting(updater);
        setPage(0);
      }}
      className="min-h-0 flex-1 rounded-none border-0"
      emptyIcon={ListTodo}
      emptyTitle="No tasks found"
      emptyDescription="Try a different search or status filter."
    />
  );
}
