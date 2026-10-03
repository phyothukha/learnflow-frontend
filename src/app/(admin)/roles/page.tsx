"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/page-header";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { RolesWorkspace } from "./components/roles-workspace";

export default function RolesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();

  const canView = hasPermission(PERMISSIONS.ROLES_VIEW);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <PageHeader
        title="Roles & Permissions"
        description="Decide what each role can see and do in the portals"
      />
      <RolesWorkspace />
    </div>
  );
}
