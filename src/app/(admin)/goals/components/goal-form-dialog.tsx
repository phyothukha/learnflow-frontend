"use client";

import { useEffect } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { DatePicker } from "@/components/date-picker";
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
import { GOAL_CATEGORIES, GOAL_COLORS, GOAL_FOCUS } from "@/lib/goal-meta";
import { TASK_PRIORITY } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  GoalCategory,
  GoalFocus,
  GoalStatus,
  type Goal,
  type GoalInput,
} from "@/store/server/goals/interface";
import { TaskPriority } from "@/store/server/tasks/interface";
import { DATE_KEY } from "@/utils/scheduler";

const schema = z
  .object({
    Title: z.string().trim().min(1, "Title is required"),
    Description: z.string(),
    Category: z.nativeEnum(GoalCategory),
    Priority: z.nativeEnum(TaskPriority),
    Focus: z.nativeEnum(GoalFocus),
    CurrentLevel: z.string(),
    TargetLevel: z.string(),
    StartDate: z.string().min(1, "Start date is required"),
    TargetDate: z.string().min(1, "Target date is required"),
    Color: z.string(),
  })
  .refine((values) => values.TargetDate > values.StartDate, {
    path: ["TargetDate"],
    message: "Target date must be after the start date",
  });

type FormValues = z.infer<typeof schema>;

function toFormValues(goal: Goal | null): FormValues {
  const today = dayjs();
  return {
    Title: goal?.Title ?? "",
    Description: goal?.Description ?? "",
    Category: goal?.Category ?? GoalCategory.Language,
    Priority: goal?.Priority ?? TaskPriority.Medium,
    Focus: goal?.Focus ?? GoalFocus.Secondary,
    CurrentLevel: goal?.CurrentLevel ?? "",
    TargetLevel: goal?.TargetLevel ?? "",
    StartDate: goal?.StartDate ?? today.format(DATE_KEY),
    TargetDate: goal?.TargetDate ?? today.add(3, "month").format(DATE_KEY),
    Color: goal?.Color ?? GOAL_COLORS[0],
  };
}

export interface GoalFormDialogProps {
  open: boolean;
  goal: Goal | null;
  onOpenChange: (open: boolean) => void;
}

export function GoalFormDialog({
  open,
  goal,
  onOpenChange,
}: GoalFormDialogProps) {
  const router = useRouter();
  const createGoal = usePlannerStore((state) => state.createGoal);
  const updateGoal = usePlannerStore((state) => state.updateGoal);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(null),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(goal));
  }, [open, goal, form]);

  function onSubmit(values: FormValues) {
    const input: GoalInput = {
      ...values,
      Title: values.Title.trim(),
      Description: values.Description.trim() || null,
      CurrentLevel: values.CurrentLevel.trim() || null,
      TargetLevel: values.TargetLevel.trim() || null,
      Status: goal?.Status ?? GoalStatus.Active,
    };
    if (goal) {
      updateGoal(goal.Id, input);
      toast.success("Goal updated.");
      onOpenChange(false);
      return;
    }
    const id = createGoal(input);
    toast.success("Goal created. Add milestones to break it down.");
    onOpenChange(false);
    router.push(`/goals/${id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription>
            Describe where you are now, where you want to be and by when.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="Title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Pass JLPT N2" {...field} />
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
                  <FormLabel>Why it matters</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optional" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="Category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from(GOAL_CATEGORIES, ([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            <meta.icon />
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
                name="Focus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from(GOAL_FOCUS, ([value, meta]) => (
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="CurrentLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current level</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. N5" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="TargetLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target level</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. N2" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="StartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
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
                name="TargetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target date</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="Color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex gap-2">
                    {GOAL_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Color ${color}`}
                        aria-pressed={field.value === color}
                        onClick={() => field.onChange(color)}
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          field.value === color && "ring-2 ring-foreground/40",
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {field.value === color && (
                          <Check className="size-3.5" />
                        )}
                      </button>
                    ))}
                  </div>
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
                {goal ? "Save changes" : "Create goal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
