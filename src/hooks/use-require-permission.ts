"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { PermissionCode } from "@/lib/permissions";
import { usePermission } from "@/hooks/use-permission";

/**
 * Page-level guard: redirects to /forbidden once the session is known and the
 * user lacks `code`. Returns `true` only when the page may render.
 *
 * @example
 * const canView = useRequirePermission(PERMISSIONS.COURSES_VIEW);
 * if (!canView) return null;
 */
export function useRequirePermission(code: PermissionCode) {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const allowed = hasPermission(code);

  useEffect(() => {
    if (status === "authenticated" && !allowed) router.replace("/forbidden");
  }, [status, allowed, router]);

  return status === "authenticated" && allowed;
}
