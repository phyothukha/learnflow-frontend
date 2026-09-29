"use client";

import { PageHeader } from "@/components/page-header";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { EnrollmentsDialogs } from "./components/enrollments-dialogs";
import { EnrollmentsPrimaryButtons } from "./components/enrollments-primary-buttons";
import { EnrollmentsTable } from "./components/enrollments-table";
import EnrollmentsProvider from "./context/enrollments-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function EnrollmentsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();

  const canView = hasPermission(PERMISSIONS.ENROLLMENTS_VIEW);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  return (
    <EnrollmentsProvider>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <PageHeader
          title="Enrollments"
          description="Track which students are enrolled in each course and their progress"
          actions={<EnrollmentsPrimaryButtons />}
        />
        <div className="min-h-0 flex-1">
          <EnrollmentsTable />
        </div>
      </div>
      <EnrollmentsDialogs />
    </EnrollmentsProvider>
  );
}
