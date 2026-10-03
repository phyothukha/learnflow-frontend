"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/page-header";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { EnrollDialog } from "./components/enroll-dialog";
import { LearnersPrimaryButtons } from "./components/learners-primary-buttons";
import { LearnersTable } from "./components/learners-table";
import LearnersProvider from "./context/learners-context";

export default function LearnersPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();

  const canView = hasPermission(PERMISSIONS.LEARNERS_VIEW);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

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
