"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/page-header";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { InviteLearnerForm } from "../components/invite-learner-form";

export default function InviteLearnerPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.LEARNERS_CREATE);

  useEffect(() => {
    if (status === "authenticated" && !canCreate) router.replace("/forbidden");
  }, [status, canCreate, router]);

  if (status !== "authenticated" || !canCreate) return null;

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
