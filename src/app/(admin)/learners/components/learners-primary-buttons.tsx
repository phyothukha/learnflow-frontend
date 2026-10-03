"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";

export function LearnersPrimaryButtons() {
  const { hasPermission } = usePermission();

  if (!hasPermission(PERMISSIONS.LEARNERS_CREATE)) return null;

  return (
    <Button asChild>
      <Link href="/learners/invite">
        <UserPlus />
        Invite learner
      </Link>
    </Button>
  );
}
