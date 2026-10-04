"use client";

import type { Row } from "@tanstack/react-table";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import type { Course } from "@/store/server/courses/interface";
import { useDeleteCourse } from "@/store/server/courses/mutations";
import { CoursesDialogType, useCourses } from "../context/courses-context";

interface DataTableRowActionsProps {
  row: Row<Course>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const course = row.original;
  const { setOpen, setCurrentRow } = useCourses();
  const { hasPermission } = usePermission();
  const { mutateAsync: deleteCourse } = useDeleteCourse();
  const { confirmDelete, dialogProps } = useConfirmDialog();

  const canUpdate = hasPermission(PERMISSIONS.COURSES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.COURSES_DELETE);
  if (!canUpdate && !canDelete) return null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 data-[state=open]:bg-muted"
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canUpdate && (
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(course);
                setOpen(CoursesDialogType.Edit);
              }}
            >
              <Pencil />
              Edit course
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                confirmDelete({
                  itemName: course.Title,
                  description:
                    "This will permanently delete the course and all of its lessons and enrollments. This action cannot be undone.",
                  successMessage: "Course deleted.",
                  errorMessage: "Failed to delete course.",
                  onConfirm: () => deleteCourse(course.Id),
                })
              }
            >
              <Trash2 />
              Delete course
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
