"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "@/store/server/courses/mutations";
import { useCourses } from "./courses-provider";

const schema = z.object({
  Title: z.string().min(1, "Title is required"),
  Description: z.string().optional(),
  Category: z.string().optional(),
  IsPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  Title: "",
  Description: "",
  Category: "",
  IsPublished: false,
};

export function CoursesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useCourses();

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const isEdit = open === "edit";
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open === "edit" && currentRow) {
      form.reset({
        Title: currentRow.Title,
        Description: currentRow.Description ?? "",
        Category: currentRow.Category ?? "",
        IsPublished: currentRow.IsPublished,
      });
    }
    if (open === "create") form.reset(emptyValues);
  }, [open, currentRow, form]);

  function closeDialog() {
    setOpen(null);
    setCurrentRow(null);
  }

  function onSubmit(values: FormValues) {
    if (isEdit && currentRow) {
      updateCourse.mutate(
        { id: currentRow.Id, payload: values },
        {
          onSuccess: () => {
            toast.success("Course updated.");
            closeDialog();
          },
          onError: () => toast.error("Failed to update course."),
        }
      );
    } else {
      createCourse.mutate(values, {
        onSuccess: () => {
          toast.success("Course created.");
          closeDialog();
        },
        onError: () => toast.error("Failed to create course."),
      });
    }
  }

  function onDelete() {
    if (!currentRow) return;
    deleteCourse.mutate(currentRow.Id, {
      onSuccess: () => {
        toast.success("Course deleted.");
        closeDialog();
      },
      onError: () => toast.error("Failed to delete course."),
    });
  }

  const isPending = createCourse.isPending || updateCourse.isPending;

  return (
    <>
      <Dialog
        open={open === "create" || open === "edit"}
        onOpenChange={(isOpen) => !isOpen && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit course" : "Create course"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the course details below."
                : "Fill in the details for the new course."}
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
                      <Input placeholder="Course title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Programming" {...field} />
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
                      <Textarea placeholder="What is this course about?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="IsPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Published</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
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

      <AlertDialog
        open={open === "delete"}
        onOpenChange={(isOpen) => !isOpen && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{currentRow?.Title}” and all of its
              lessons and enrollments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={deleteCourse.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteCourse.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
