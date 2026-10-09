"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { useRolesStore } from "@/store/client/mock/roles-store";
import { RolePermissionForm } from "../components/role-permission-form";

export default function NewRolePage() {
  const router = useRouter();
  const createRole = useRolesStore((state) => state.createRole);
  const roles = useRolesStore((state) => state.roles);
  const canCreate = useRequirePermission(PERMISSIONS.ROLES_CREATE);

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
