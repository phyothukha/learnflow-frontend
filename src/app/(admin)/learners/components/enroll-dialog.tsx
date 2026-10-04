"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LearnerStatus,
  MOCK_COURSES,
  useLearnersStore,
} from "@/store/client/mock/learners-store";
import { LearnersDialogType, useLearners } from "../context/learners-context";

const enrollSchema = z.object({
  CourseId: z.string().min(1, "Course is required"),
});

export function EnrollDialog() {
  const { open, currentId, closeDialog } = useLearners();
  const learner = useLearnersStore((state) =>
    state.learners.find((item) => item.Id === currentId),
  );
  const enroll = useLearnersStore((state) => state.enroll);

  const form = useForm<z.infer<typeof enrollSchema>>({
    resolver: zodResolver(enrollSchema),
    defaultValues: { CourseId: "" },
  });

  useEffect(() => {
    if (open === LearnersDialogType.Enroll) form.reset({ CourseId: "" });
  }, [open, form]);

  const available = MOCK_COURSES.filter(
    (course) => !learner?.Enrollments.some((e) => e.CourseId === course.Id),
  );

  function onSubmit({ CourseId }: z.infer<typeof enrollSchema>) {
    if (!learner) return;
    enroll(learner.Id, CourseId);
    toast.success(`${learner.Name} enrolled.`);
    closeDialog();
  }

  return (
    <Dialog
      open={open === LearnersDialogType.Enroll}
      onOpenChange={(isOpen) => !isOpen && closeDialog()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll in a course</DialogTitle>
          <DialogDescription>
            {learner
              ? `Choose a course for ${learner.Name}.`
              : "Choose a course."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="CourseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={available.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            available.length === 0
                              ? "Already enrolled in every course"
                              : "Select a course"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {available.map((course) => (
                        <SelectItem key={course.Id} value={course.Id}>
                          {course.Title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  available.length === 0 ||
                  learner?.Status === LearnerStatus.Disabled
                }
              >
                Enroll
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
