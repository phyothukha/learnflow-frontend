"use client";

import { useEffect } from "react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DatePicker, TimePicker } from "@/components/date-picker";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialogVariant } from "@/hooks/use-confirm-dialog";
import { TASK_CATEGORIES, TASK_PRIORITY, TASK_STATUS } from "@/lib/task-meta";
import {
  TaskCategory,
  TaskPriority,
  TaskStatus,
  type Task,
} from "@/store/server/tasks/interface";
import {
  TasksDialogType,
  useTasks,
  type TaskDraft,
  type TaskInput,
} from "../context/tasks-context";
import { TASK_ASSIGNEES } from "../data/fake-tasks";

const schema = z
  .object({
    Title: z.string().trim().min(1, "Title is required"),
    Description: z.string(),
    Category: z.nativeEnum(TaskCategory),
    Priority: z.nativeEnum(TaskPriority),
    Status: z.nativeEnum(TaskStatus),
    AssigneeEmail: z.string().min(1, "Assignee is required"),
    Date: z.string().min(1, "Date is required"),
    StartTime: z.string().min(1, "Start time is required"),
    EndTime: z.string().min(1, "End time is required"),
    Location: z.string(),
    Tags: z.array(z.string()),
  })
  .refine((values) => values.EndTime > values.StartTime, {
    path: ["EndTime"],
    message: "End time must be after start time",
  });

type FormValues = z.infer<typeof schema>;

function toFormValues(task: Task | null, draft: TaskDraft | null): FormValues {
  const start = dayjs(task?.StartAt ?? draft?.StartAt ?? undefined);
  const base =
    task?.StartAt || draft?.StartAt ? start : start.hour(9).minute(0);
  const end = task?.EndAt
    ? dayjs(task.EndAt)
    : draft?.EndAt
      ? dayjs(draft.EndAt)
      : base.add(1, "hour");

  return {
    Title: task?.Title ?? "",
    Description: task?.Description ?? "",
    Category: task?.Category ?? TaskCategory.Study,
    Priority: task?.Priority ?? TaskPriority.Medium,
    Status: task?.Status ?? draft?.Status ?? TaskStatus.Todo,
    AssigneeEmail: task?.Assignee.Email ?? TASK_ASSIGNEES[0].Email,
    Date: base.format("YYYY-MM-DD"),
    StartTime: base.format("HH:mm"),
    EndTime: end.format("HH:mm"),
    Location: task?.Location ?? "",
    Tags: task?.Tags ?? [],
  };
}

function toTaskInput(values: FormValues): TaskInput {
  const assignee =
    TASK_ASSIGNEES.find((person) => person.Email === values.AssigneeEmail) ??
    TASK_ASSIGNEES[0];
  return {
    Title: values.Title.trim(),
    Description: values.Description.trim() || null,
    Category: values.Category,
    Priority: values.Priority,
    Status: values.Status,
    Assignee: assignee,
    StartAt: dayjs(`${values.Date}T${values.StartTime}`).toISOString(),
    EndAt: dayjs(`${values.Date}T${values.EndTime}`).toISOString(),
    Location: values.Location.trim() || null,
    Tags: values.Tags,
  };
}

export function TasksDialogs() {
  const {
    open,
    currentTask,
    draft,
    closeDialog,
    createTask,
    updateTask,
    deleteTask,
  } = useTasks();
  const isEdit = open === TasksDialogType.Edit;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(null, null),
  });

  useEffect(() => {
    if (open === TasksDialogType.Create) form.reset(toFormValues(null, draft));
    if (open === TasksDialogType.Edit)
      form.reset(toFormValues(currentTask, null));
  }, [open, currentTask, draft, form]);

  function onSubmit(values: FormValues) {
    const input = toTaskInput(values);
    if (isEdit && currentTask) {
      updateTask(currentTask.Id, input);
      toast.success("Task updated.");
    } else {
      createTask(input);
      toast.success("Task created.");
    }
    closeDialog();
  }

  return (
    <>
      <Dialog
        open={open === TasksDialogType.Create || isEdit}
        onOpenChange={(isOpen) => !isOpen && closeDialog()}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the task details and schedule."
                : "Add a task and place it on your timeline."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="Title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Read ML Ch. 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="What needs to be done?"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="Category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from(TASK_CATEGORIES, ([value, meta]) => (
                            <SelectItem key={value} value={value}>
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: meta.color }}
                              />
                              {meta.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="AssigneeEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TASK_ASSIGNEES.map((person) => (
                            <SelectItem key={person.Email} value={person.Email}>
                              {person.Name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from(TASK_STATUS, ([value, meta]) => (
                            <SelectItem key={value} value={value}>
                              <span
                                className={`size-2 rounded-full ${meta.dotClass}`}
                              />
                              {meta.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from(TASK_PRIORITY, ([value, meta]) => (
                            <SelectItem key={value} value={value}>
                              {meta.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <FormField
                  control={form.control}
                  name="Date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="StartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="EndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="Location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Room, link or place" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <TagInput value={field.value} onChange={field.onChange} />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEdit ? "Save changes" : "Create task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open === TasksDialogType.Delete}
        pending={false}
        options={{
          title: `Delete "${currentTask?.Title ?? "task"}"?`,
          description: "This action cannot be undone.",
          confirmText: "Delete",
          variant: ConfirmDialogVariant.Destructive,
        }}
        onConfirm={() => {
          if (currentTask) deleteTask(currentTask.Id);
          toast.success("Task deleted.");
          closeDialog();
        }}
        onCancel={closeDialog}
      />
    </>
  );
}
