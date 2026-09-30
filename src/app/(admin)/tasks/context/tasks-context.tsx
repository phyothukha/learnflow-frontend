"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Task, TaskStatus } from "@/store/server/tasks/interface";
import { createFakeTasks } from "../data/fake-tasks";

export enum TasksDialogType {
  Create = "create",
  Edit = "edit",
  Delete = "delete",
}

export type TaskInput = Omit<Task, "Id">;

/** Prefilled values when creating from a calendar slot or a board column. */
export interface TaskDraft {
  StartAt?: string;
  EndAt?: string;
  Status?: TaskStatus;
}

interface TasksContextType {
  tasks: Task[];
  createTask: (input: TaskInput) => void;
  updateTask: (id: string, patch: Partial<TaskInput>) => void;
  deleteTask: (id: string) => void;
  open: TasksDialogType | null;
  currentTask: Task | null;
  draft: TaskDraft | null;
  openCreate: (draft?: TaskDraft) => void;
  openEdit: (task: Task) => void;
  openDelete: (task: Task) => void;
  closeDialog: () => void;
}

const TasksContext = createContext<TasksContextType | null>(null);

interface Props {
  children: ReactNode;
}

export default function TasksProvider({ children }: Props) {
  const [tasks, setTasks] = useState(createFakeTasks);
  const [open, setOpen] = useState<TasksDialogType | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [draft, setDraft] = useState<TaskDraft | null>(null);

  const createTask = (input: TaskInput) =>
    setTasks((current) => [
      ...current,
      { ...input, Id: `task-${crypto.randomUUID()}` },
    ]);

  const updateTask = (id: string, patch: Partial<TaskInput>) =>
    setTasks((current) =>
      current.map((task) => (task.Id === id ? { ...task, ...patch } : task)),
    );

  const deleteTask = (id: string) =>
    setTasks((current) => current.filter((task) => task.Id !== id));

  const openDialog = (
    type: TasksDialogType,
    task: Task | null,
    nextDraft: TaskDraft | null = null,
  ) => {
    setCurrentTask(task);
    setDraft(nextDraft);
    setOpen(type);
  };

  return (
    <TasksContext
      value={{
        tasks,
        createTask,
        updateTask,
        deleteTask,
        open,
        currentTask,
        draft,
        openCreate: (nextDraft) =>
          openDialog(TasksDialogType.Create, null, nextDraft),
        openEdit: (task) => openDialog(TasksDialogType.Edit, task),
        openDelete: (task) => openDialog(TasksDialogType.Delete, task),
        closeDialog: () => setOpen(null),
      }}
    >
      {children}
    </TasksContext>
  );
}

export const useTasks = () => {
  const tasksContext = useContext(TasksContext);

  if (!tasksContext) {
    throw new Error("useTasks has to be used within <TasksProvider>");
  }

  return tasksContext;
};
