"use client";

import { useSession } from "next-auth/react";
import type { PermissionCode } from "@/lib/permissions";

export function usePermission() {
  const { data: session } = useSession();

  const permissions = session?.user?.permissions ?? [];
  const isAdmin = session?.user?.isAdmin ?? false;

  const hasPermission = (code: PermissionCode) =>
    isAdmin || permissions.includes(code);

  const hasAnyPermission = (codes: PermissionCode[]) =>
    isAdmin || codes.some((code) => permissions.includes(code));

  const hasAllPermissions = (codes: PermissionCode[]) =>
    isAdmin || codes.every((code) => permissions.includes(code));

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    permissions,
  };
}
