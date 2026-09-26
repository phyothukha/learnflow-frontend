"use client";

import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { CoursesProvider } from "./components/courses-provider";
import { CoursesCreateButton, CoursesTable } from "./components/courses-table";
import { CoursesDialogs } from "./components/courses-dialogs";
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
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Courses</h1>
          <CoursesCreateButton />
        </div>
        <div className="min-h-0 flex-1">
          <CoursesTable />
        </div>
      </div>
      <CoursesDialogs />
    </CoursesProvider>
  );
}
