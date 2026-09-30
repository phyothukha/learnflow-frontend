"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import type { PermissionCode } from "@/lib/permissions";

/** Redirects to `/forbidden` without the permission; true once the page may render. */
export function usePageAccess(permission: PermissionCode) {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const allowed = hasPermission(permission);

  useEffect(() => {
    if (status === "authenticated" && !allowed) router.replace("/forbidden");
  }, [status, allowed, router]);

  return status === "authenticated" && allowed;
}
