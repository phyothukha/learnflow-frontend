"use client";

import { PageHeader } from "@/components/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { EnrollDialog } from "./components/enroll-dialog";
import { MembersPrimaryButtons } from "./components/members-primary-buttons";
import { MembersTable } from "./components/members-table";
import MembersProvider from "./context/members-context";

export default function MembersPage() {
  const canView = useRequirePermission(PERMISSIONS.MEMBERS_VIEW);

  if (!canView) return null;

  return (
    <MembersProvider>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <PageHeader
          title="Members"
          description="Invite by email, set portal access, and enroll them into courses"
          actions={<MembersPrimaryButtons />}
        />
        <div className="min-h-0 flex-1">
          <MembersTable />
        </div>
      </div>
      <EnrollDialog />
    </MembersProvider>
  );
}
