"use client";

import { PageHeader } from "@/components/page-header";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { CoursesDialogs } from "./components/courses-dialogs";
import { CoursesPrimaryButtons } from "./components/courses-primary-buttons";
import { CoursesTable } from "./components/courses-table";
import CoursesProvider from "./context/courses-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function CoursesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();

  const canView = hasPermission(PERMISSIONS.COURSES_VIEW);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

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
