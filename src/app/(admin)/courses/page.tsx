"use client";

import { PageHeader } from "@/components/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { CoursesDialogs } from "./components/courses-dialogs";
import { CoursesPrimaryButtons } from "./components/courses-primary-buttons";
import { CoursesTable } from "./components/courses-table";
import CoursesProvider from "./context/courses-context";

export default function CoursesPage() {
  const canView = useRequirePermission(PERMISSIONS.COURSES_VIEW);

  if (!canView) return null;

  return (
    <CoursesProvider>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <PageHeader
          title="Courses"
          description="Create, publish and manage the courses students can enroll in"
          actions={<CoursesPrimaryButtons />}
        />
        <div className="min-h-0 flex-1">
          <CoursesTable />
        </div>
      </div>
      <CoursesDialogs />
    </CoursesProvider>
  );
}
