"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

export function MembersPrimaryButtons() {
  const { hasPermission } = usePermission();

  if (!hasPermission(PERMISSIONS.MEMBERS_CREATE)) return null;

  return (
    <Button asChild>
      <Link href="/members/invite">
        <UserPlus />
        Invite member
      </Link>
    </Button>
  );
}
