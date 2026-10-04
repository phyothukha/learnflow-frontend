"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import {
  LearnerStatus,
  useLearnersStore,
} from "@/store/client/mock/learners-store";
import { EditLearnerForm } from "../../components/edit-learner-form";

interface EditLearnerPageProps {
  params: Promise<{ learnerId: string }>;
}

export default function EditLearnerPage({ params }: EditLearnerPageProps) {
  const { learnerId } = use(params);
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.LEARNERS_UPDATE);
  const learner = useLearnersStore((state) =>
    state.learners.find((item) => item.Id === learnerId),
  );

  useEffect(() => {
    if (status === "authenticated" && !canUpdate) router.replace("/forbidden");
  }, [status, canUpdate, router]);

  if (status !== "authenticated" || !canUpdate) return null;

  if (!learner) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm font-medium">Learner not found</p>
        <Button variant="subtle" asChild>
          <Link href="/learners">Back to learners</Link>
        </Button>
      </div>
    );
  }

  const label =
    learner.Status === LearnerStatus.Invited ? learner.Email : learner.Name;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <div className="flex shrink-0 items-start gap-3">
        <Button
          variant="subtle"
          size="icon"
          className="size-9 shrink-0"
          asChild
        >
          <Link href={`/learners/${learner.Id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Edit learner</h1>
          <p className="mt-1 max-w-xl truncate text-sm text-muted-foreground">
            {label} · role and portal access
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <EditLearnerForm learner={learner} />
      </div>
    </div>
  );
}
