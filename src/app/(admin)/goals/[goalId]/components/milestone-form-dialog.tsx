"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { MILESTONE_STATUS } from "@/lib/goal-meta";
import { usePlannerStore } from "@/store/client/planner-store";
import {
  MilestoneStatus,
  type Milestone,
} from "@/store/server/goals/interface";

const schema = z.object({
  Title: z.string().trim().min(1, "Title is required"),
  Description: z.string(),
  Weight: z.coerce
    .number()
    .int("Use a whole number")
    .min(1, "At least 1")
    .max(100, "At most 100"),
  TargetDate: z.string(),
  Status: z.nativeEnum(MilestoneStatus),
});

type FormValues = z.infer<typeof schema>;

export interface MilestoneFormDialogProps {
  open: boolean;
  goalId: string;
  milestone: Milestone | null;
  /** Weight not yet assigned to other milestones, used as the default. */
  remainingWeight: number;
  onOpenChange: (open: boolean) => void;
}

export function MilestoneFormDialog({
  open,
  goalId,
  milestone,
  remainingWeight,
  onOpenChange,
}: MilestoneFormDialogProps) {
  const createMilestone = usePlannerStore((state) => state.createMilestone);
  const updateMilestone = usePlannerStore((state) => state.updateMilestone);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    form.reset({
      Title: milestone?.Title ?? "",
      Description: milestone?.Description ?? "",
      Weight: milestone?.Weight ?? Math.max(5, remainingWeight),
      TargetDate: milestone?.TargetDate ?? "",
      Status: milestone?.Status ?? MilestoneStatus.NotStarted,
    });
  }, [open, milestone, remainingWeight, form]);

  function onSubmit(values: FormValues) {
    const input = {
      GoalId: goalId,
      Title: values.Title.trim(),
      Description: values.Description.trim() || null,
      Weight: values.Weight,
      StartDate: milestone?.StartDate ?? null,
      TargetDate: values.TargetDate || null,
      Status: values.Status,
    };
    if (milestone) updateMilestone(milestone.Id, input);
    else createMilestone(input);
    toast.success(milestone ? "Milestone updated." : "Milestone added.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {milestone ? "Edit milestone" : "New milestone"}
          </DialogTitle>
          <DialogDescription>
            Weight decides how much this milestone counts toward goal progress.
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
                    <Input placeholder="e.g. N4 level" {...field} />
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
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="Weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
                    </FormControl>
                    <FormDescription>
                      {remainingWeight}% unassigned
                    </FormDescription>
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
                        placeholder="Optional"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from(MILESTONE_STATUS, ([value, meta]) => (
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
            <DialogFooter>
              <Button
                type="button"
                variant="subtle"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {milestone ? "Save changes" : "Add milestone"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
