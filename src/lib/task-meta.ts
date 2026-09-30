import type { BadgeVariant } from "@/components/ui/badge";
import {
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from "@/store/server/tasks/interface";

export enum TaskView {
  Kanban = "kanban",
  List = "list",
  Timeline = "timeline",
  Planner = "planner",
}

export interface TaskStatusMeta {
  label: string;
  variant: BadgeVariant;
  dotClass: string;
}

export interface TaskPriorityMeta {
  label: string;
  variant: BadgeVariant;
}

export interface TaskCategoryMeta {
  label: string;
  color: string;
}

export const TASK_STATUS = new Map<TaskStatus, TaskStatusMeta>([
  [
    TaskStatus.Todo,
    { label: "To Do", variant: "status-slate", dotClass: "bg-slate-400" },
  ],
  [
    TaskStatus.InProgress,
    { label: "In Progress", variant: "status-blue", dotClass: "bg-sky-500" },
  ],
  [
    TaskStatus.Review,
    { label: "In Review", variant: "status-amber", dotClass: "bg-amber-500" },
  ],
  [
    TaskStatus.Done,
    { label: "Done", variant: "status-green", dotClass: "bg-emerald-500" },
  ],
]);

export const TASK_PRIORITY = new Map<TaskPriority, TaskPriorityMeta>([
  [TaskPriority.Low, { label: "Low", variant: "info" }],
  [TaskPriority.Medium, { label: "Medium", variant: "warning" }],
  [TaskPriority.High, { label: "High", variant: "orange" }],
  [TaskPriority.Urgent, { label: "Urgent", variant: "danger" }],
]);

export const TASK_CATEGORIES = new Map<TaskCategory, TaskCategoryMeta>([
  [TaskCategory.Study, { label: "Study", color: "#3b82f6" }],
  [TaskCategory.Assignment, { label: "Assignment", color: "#8b5cf6" }],
  [TaskCategory.Meeting, { label: "Meeting", color: "#f59e0b" }],
  [TaskCategory.Personal, { label: "Personal", color: "#10b981" }],
  [TaskCategory.Work, { label: "Work", color: "#f43f5e" }],
]);

export const TASK_PRIORITY_RANK = new Map<TaskPriority, number>([
  [TaskPriority.Low, 0],
  [TaskPriority.Medium, 1],
  [TaskPriority.High, 2],
  [TaskPriority.Urgent, 3],
]);
