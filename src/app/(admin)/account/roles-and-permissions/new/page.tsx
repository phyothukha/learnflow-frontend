"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useRolesStore } from "@/store/client/mock/roles-store";
import { RolePermissionForm } from "../components/role-permission-form";

export default function NewRolePage() {
  const router = useRouter();
  const createRole = useRolesStore((state) => state.createRole);
  const roles = useRolesStore((state) => state.roles);
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.ROLES_CREATE);

  useEffect(() => {
    if (!canCreate) router.replace("/forbidden");
  }, [canCreate, router]);

  if (!canCreate) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <PageHeader
        className="shrink-0"
        title="New Role"
        description="Create a role and choose what it can see and do"
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <RolePermissionForm
          mode="create"
          onSubmit={({ Name, Description, Permissions }) => {
            const taken = roles.some(
              (role) => role.Name.toLowerCase() === Name.toLowerCase(),
            );
            if (taken) {
              toast.error("A role with this name already exists.");
              return;
            }
            const role = createRole({ Name, Description, Permissions });
            toast.success("Role created.");
            router.push(`/account/roles-and-permissions/${role.Id}`);
          }}
        />
      </div>
    </div>
  );
}
