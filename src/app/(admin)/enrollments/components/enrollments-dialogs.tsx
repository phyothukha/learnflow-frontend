"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useFetchCourses } from "@/store/server/courses/queries";
import { EnrollmentStatus } from "@/store/server/enrollments/interface";
import {
  useCreateEnrollment,
  useUpdateEnrollment,
} from "@/store/server/enrollments/mutations";
import {
  EnrollmentsDialogType,
  useEnrollments,
} from "../context/enrollments-context";

const STATUSES = Object.values(EnrollmentStatus);

const schema = z.object({
  StudentName: z.string().min(1, "Student name is required"),
  StudentEmail: z.string().email("Enter a valid email"),
  CourseId: z.string().min(1, "Course is required"),
  Status: z.nativeEnum(EnrollmentStatus),
  ProgressPercent: z.coerce.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  StudentName: "",
  StudentEmail: "",
  CourseId: "",
  Status: EnrollmentStatus.Pending,
  ProgressPercent: 0,
};

export function EnrollmentsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useEnrollments();

  const { data: coursesData } = useFetchCourses({ page: 0, limit: 100 });
  const courses = coursesData?.Items ?? [];

  const createEnrollment = useCreateEnrollment();
  const updateEnrollment = useUpdateEnrollment();
  const isEdit = open === EnrollmentsDialogType.Edit;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open === EnrollmentsDialogType.Edit && currentRow) {
      form.reset({
        StudentName: currentRow.StudentName,
        StudentEmail: currentRow.StudentEmail,
        CourseId: currentRow.CourseId,
        Status: currentRow.Status,
        ProgressPercent: currentRow.ProgressPercent,
      });
    }
    if (open === EnrollmentsDialogType.Create) form.reset(emptyValues);
  }, [open, currentRow, form]);

  function closeDialog() {
    setOpen(null);
    setCurrentRow(null);
  }

  function onSubmit(values: FormValues) {
    if (isEdit && currentRow) {
      updateEnrollment.mutate(
        { id: currentRow.Id, payload: values },
        {
          onSuccess: () => {
            toast.success("Enrollment updated.");
            closeDialog();
          },
          onError: () => toast.error("Failed to update enrollment."),
        },
      );
    } else {
      createEnrollment.mutate(values, {
        onSuccess: () => {
          toast.success("Enrollment created.");
          closeDialog();
        },
        onError: () => toast.error("Failed to create enrollment."),
      });
    }
  }

  const isPending = createEnrollment.isPending || updateEnrollment.isPending;

  return (
    <>
      <Dialog
        open={
          open === EnrollmentsDialogType.Create ||
          open === EnrollmentsDialogType.Edit
        }
        onOpenChange={(isOpen) => !isOpen && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit enrollment" : "Create enrollment"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the enrollment details below."
                : "Enroll a student into a course."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="StudentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="StudentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jane@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="CourseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course) => (
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
              <div className="grid grid-cols-2 gap-4">
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
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
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
                  name="ProgressPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress %</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
