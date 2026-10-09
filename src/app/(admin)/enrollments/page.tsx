"use client";

import { PageHeader } from "@/components/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { EnrollmentsDialogs } from "./components/enrollments-dialogs";
import { EnrollmentsPrimaryButtons } from "./components/enrollments-primary-buttons";
import { EnrollmentsTable } from "./components/enrollments-table";
import EnrollmentsProvider from "./context/enrollments-context";

export default function EnrollmentsPage() {
  const canView = useRequirePermission(PERMISSIONS.ENROLLMENTS_VIEW);

  if (!canView) return null;

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
