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
  MemberStatus,
  MOCK_COURSES,
  useMembersStore,
} from "@/store/client/mock/members-store";
import { MembersDialogType, useMembers } from "../context/members-context";

const enrollSchema = z.object({
  CourseId: z.string().min(1, "Course is required"),
});

export function EnrollDialog() {
  const { open, currentId, closeDialog } = useMembers();
  const member = useMembersStore((state) =>
    state.members.find((item) => item.Id === currentId),
  );
  const enroll = useMembersStore((state) => state.enroll);

  const form = useForm<z.infer<typeof enrollSchema>>({
    resolver: zodResolver(enrollSchema),
    defaultValues: { CourseId: "" },
  });

  useEffect(() => {
    if (open === MembersDialogType.Enroll) form.reset({ CourseId: "" });
  }, [open, form]);

  const available = MOCK_COURSES.filter(
    (course) => !member?.Enrollments.some((e) => e.CourseId === course.Id),
  );

  function onSubmit({ CourseId }: z.infer<typeof enrollSchema>) {
    if (!member) return;
    enroll(member.Id, CourseId);
    toast.success(`${member.Name} enrolled.`);
    closeDialog();
  }

  return (
    <Dialog
      open={open === MembersDialogType.Enroll}
      onOpenChange={(isOpen) => !isOpen && closeDialog()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll in a course</DialogTitle>
          <DialogDescription>
            {member
              ? `Choose a course for ${member.Name}.`
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
                  member?.Status === MemberStatus.Disabled
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
