"use client";

import { Plus } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { CoursesDialogType, useCourses } from "../context/courses-context";
import { Button } from "@/components/ui/button";

export function CoursesPrimaryButtons() {
  const { setOpen } = useCourses();
  const { hasPermission } = usePermission();

  if (!hasPermission(PERMISSIONS.COURSES_CREATE)) return null;

  return (
    <Button onClick={() => setOpen(CoursesDialogType.Create)}>
      <Plus />
      New Course
    </Button>
  );
}
