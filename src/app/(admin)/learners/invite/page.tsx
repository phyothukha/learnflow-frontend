"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <Button
          variant="subtle"
          size="icon"
          className="size-9 shrink-0"
          asChild
        >
          <Link href="/learners">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            Invite learner
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Invite by email. Everyone gets the Learner role — just choose which
            portal tabs they can open. They set their name when they accept.
          </p>
        </div>
      </div>

      <div className="library-card mx-auto w-full max-w-xl p-5 sm:p-6">
        <InviteLearnerForm />
      </div>
    </div>
  );
}
