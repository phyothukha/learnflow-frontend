"use client";

import { useSession } from "next-auth/react";
import type { PermissionCode } from "@/lib/permissions";

const EMPTY_PERMISSIONS: PermissionCode[] = [];

export function usePermission() {
  const { data: session } = useSession();

  const permissions = session?.user?.permissions ?? EMPTY_PERMISSIONS;
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
