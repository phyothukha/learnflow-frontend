"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { RolesTable } from "./components/roles-table";
import { Button } from "@/components/ui/button";

export default function RolesAndPermissionsPage() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.ROLES_CREATE);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-6">
      <PageHeader
        className="shrink-0"
        title="Roles & Permissions"
        description="Create roles and decide what each one can see and do"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/account/roles-and-permissions/new">
                <Plus />
                New Role
              </Link>
            </Button>
          ) : undefined
        }
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <RolesTable />
      </div>
    </div>
  );
}
