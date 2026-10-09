"use client";

import { PageHeader } from "@/components/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { EnrollDialog } from "./components/enroll-dialog";
import { LearnersPrimaryButtons } from "./components/learners-primary-buttons";
import { LearnersTable } from "./components/learners-table";
import LearnersProvider from "./context/learners-context";

export default function LearnersPage() {
  const canView = useRequirePermission(PERMISSIONS.LEARNERS_VIEW);

  if (!canView) return null;

  return (
    <LearnersProvider>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <PageHeader
          title="Learners"
          description="Invite by email, set portal access, and enroll them into courses"
          actions={<LearnersPrimaryButtons />}
        />
        <div className="min-h-0 flex-1">
          <LearnersTable />
        </div>
      </div>
      <EnrollDialog />
    </LearnersProvider>
  );
}
