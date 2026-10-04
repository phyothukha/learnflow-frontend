"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

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
