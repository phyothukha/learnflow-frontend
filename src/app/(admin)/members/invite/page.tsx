"use client";

import { PageHeader } from "@/components/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { InviteMemberForm } from "../components/invite-member-form";

export default function InviteMemberPage() {
  const canCreate = useRequirePermission(PERMISSIONS.MEMBERS_CREATE);

  if (!canCreate) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <PageHeader
        className="shrink-0"
        title="Invite Member"
        description="Invite by email. They get the Member role — set portal access below."
      />
      <div className="min-h-0 flex-1">
        <InviteMemberForm />
      </div>
    </div>
  );
}
