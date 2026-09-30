"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X } from "lucide-react";
import { DatePicker } from "@/components/date-picker";
import { GoalStepChecklist } from "@/components/goal-step-checklist";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormDescription,
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
import { ESTIMATE_OPTIONS, PREFERRED_TIMES } from "@/lib/goal-meta";
import { TASK_PRIORITY } from "@/lib/task-meta";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  GoalTaskStatus,
  PreferredTime,
  type GoalTask,
  type Milestone,
} from "@/store/server/goals/interface";
import { TaskPriority } from "@/store/server/tasks/interface";
import { formatHours } from "@/utils/format";

const ANY_TIME = "any";

const schema = z.object({
  Title: z.string().trim().min(1, "Title is required"),
  Description: z.string(),
  MilestoneId: z.string().min(1, "Milestone is required"),
  EstimatedMinutes: z.string(),
  Priority: z.nativeEnum(TaskPriority),
  DueDate: z.string(),
  PreferredTime: z.union([z.nativeEnum(PreferredTime), z.literal(ANY_TIME)]),
  DependsOnIds: z.array(z.string()),
  Steps: z.array(
    z.object({ Id: z.string(), Title: z.string(), Done: z.boolean() }),
  ),
});

type FormValues = z.infer<typeof schema>;

/** Tasks that (directly or indirectly) wait on `taskId`, which would form a cycle. */
function dependents(taskId: string, tasks: GoalTask[]) {
  const found = new Set<string>();
  const queue = [taskId];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const task of tasks)
      if (
        current &&
        task.DependsOnIds.includes(current) &&
        !found.has(task.Id)
      ) {
        found.add(task.Id);
        queue.push(task.Id);
      }
  }
  return found;
}

export interface GoalTaskFormDialogProps {
  open: boolean;
  task: GoalTask | null;
  defaultMilestoneId: string | null;
  milestones: Milestone[];
  goalTasks: GoalTask[];
  onOpenChange: (open: boolean) => void;
}

export function GoalTaskFormDialog({
  open,
  task,
  defaultMilestoneId,
  milestones,
  goalTasks,
  onOpenChange,
}: GoalTaskFormDialogProps) {
  const createTask = usePlannerStore((state) => state.createTask);
  const updateTask = usePlannerStore((state) => state.updateTask);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    form.reset({
      Title: task?.Title ?? "",
      Description: task?.Description ?? "",
      MilestoneId:
        task?.MilestoneId ?? defaultMilestoneId ?? milestones[0]?.Id ?? "",
      EstimatedMinutes: String(task?.EstimatedMinutes ?? 60),
      Priority: task?.Priority ?? TaskPriority.Medium,
      DueDate: task?.DueDate ?? "",
      PreferredTime: task?.PreferredTime ?? ANY_TIME,
      DependsOnIds: task?.DependsOnIds ?? [],
      Steps: task?.Steps ?? [],
    });
  }, [open, task, defaultMilestoneId, milestones, form]);

  const blocked = task ? dependents(task.Id, goalTasks) : new Set<string>();
  const dependencyOptions = goalTasks.filter(
    (other) =>
      other.Id !== task?.Id &&
      !blocked.has(other.Id) &&
      other.Status !== GoalTaskStatus.Skipped,
  );
  const estimates = [
    ...new Set([...ESTIMATE_OPTIONS, task?.EstimatedMinutes ?? 60]),
  ].sort((a, b) => a - b);

  function onSubmit(values: FormValues) {
    const input = {
      Title: values.Title.trim(),
      Description: values.Description.trim() || null,
      MilestoneId: values.MilestoneId,
      EstimatedMinutes: Number(values.EstimatedMinutes),
      Priority: values.Priority,
      DueDate: values.DueDate || null,
      PreferredTime:
        values.PreferredTime === ANY_TIME ? null : values.PreferredTime,
      DependsOnIds: values.DependsOnIds,
      Steps: values.Steps,
      Status: task?.Status ?? GoalTaskStatus.Todo,
    };
    if (task) updateTask(task.Id, input);
    else createTask(input);
    toast.success(task ? "Task updated." : "Task added.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            The planner uses the estimate, due date and dependencies to find a
            slot.
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
                    <Input placeholder="e.g. N4 grammar chapter 6" {...field} />
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
                    <Textarea rows={2} placeholder="Optional" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="Steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps</FormLabel>
                  <FormDescription>
                    What to do inside this task. Tick them off from the
                    timeline.
                  </FormDescription>
                  <GoalStepChecklist
                    steps={field.value}
                    onChange={field.onChange}
                    className="rounded-md border p-2"
                  />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="MilestoneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a milestone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {milestones.map((milestone) => (
                          <SelectItem key={milestone.Id} value={milestone.Id}>
                            {milestone.Title}
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
                name="EstimatedMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated time</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {estimates.map((minutes) => (
                          <SelectItem key={minutes} value={String(minutes)}>
                            {formatHours(minutes)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Long tasks are split across sessions.
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
              <FormField
                control={form.control}
                name="PreferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred time</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ANY_TIME}>Any time</SelectItem>
                        {Array.from(PREFERRED_TIMES, ([value, meta]) => (
                          <SelectItem key={value} value={value}>
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
                name="DueDate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Due date</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="No due date"
                        />
                      </FormControl>
                      {field.value && (
                        <Button
                          type="button"
                          variant="subtle"
                          size="icon"
                          aria-label="Clear due date"
                          onClick={() => field.onChange("")}
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="DependsOnIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depends on</FormLabel>
                  <FormDescription>
                    The task won&apos;t be scheduled until these are done.
                  </FormDescription>
                  {dependencyOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No other tasks in this goal yet.
                    </p>
                  ) : (
                    <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border p-2">
                      {dependencyOptions.map((option) => {
                        const checked = field.value.includes(option.Id);
                        return (
                          <label
                            key={option.Id}
                            className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-muted"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) =>
                                field.onChange(
                                  next
                                    ? [...field.value, option.Id]
                                    : field.value.filter(
                                        (id) => id !== option.Id,
                                      ),
                                )
                              }
                            />
                            <span className="flex-1 truncate">
                              {option.Title}
                            </span>
                            {option.Status === GoalTaskStatus.Done && (
                              <span className="text-xs text-muted-foreground">
                                done
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="subtle"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {task ? "Save changes" : "Add task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
