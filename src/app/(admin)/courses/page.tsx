"use client";

import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { CoursesProvider } from "./courses-provider";
import { CoursesTable } from "./courses-table";
import { CoursesDialogs } from "./courses-dialogs";
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
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <CoursesTable />
      </div>
      <CoursesDialogs />
    </CoursesProvider>
  );
}
