"use client";

import { type ReactNode } from "react";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";

interface AccountSectionLayoutProps {
  children: ReactNode;
}

export default function AccountSectionLayout({
  children,
}: AccountSectionLayoutProps) {
  const canView = useRequirePermission(PERMISSIONS.ROLES_VIEW);

  if (!canView) return null;

  return <div className="flex h-full min-h-0 flex-col gap-6">{children}</div>;
}
