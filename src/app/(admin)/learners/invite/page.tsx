"use client";

import { PageHeader } from "@/components/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { InviteLearnerForm } from "../components/invite-learner-form";

export default function InviteLearnerPage() {
  const canCreate = useRequirePermission(PERMISSIONS.LEARNERS_CREATE);

  if (!canCreate) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <PageHeader
        className="shrink-0"
        title="Invite Learner"
        description="Invite by email. They get the Learner role — set portal access below."
      />
      <div className="min-h-0 flex-1">
        <InviteLearnerForm />
      </div>
    </div>
  );
}
