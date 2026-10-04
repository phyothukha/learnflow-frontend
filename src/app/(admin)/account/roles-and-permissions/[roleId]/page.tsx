"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useRolesStore } from "@/store/client/mock/roles-store";
import { RolePermissionForm } from "../components/role-permission-form";

interface EditRolePageProps {
  params: Promise<{ roleId: string }>;
}

export default function EditRolePage({ params }: EditRolePageProps) {
  const { roleId } = use(params);
  const router = useRouter();
  const role = useRolesStore((state) =>
    state.roles.find((item) => item.Id === roleId),
  );
  const updateRole = useRolesStore((state) => state.updateRole);
  const roles = useRolesStore((state) => state.roles);
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.ROLES_UPDATE);

  useEffect(() => {
    if (!role) router.replace("/account/roles-and-permissions");
  }, [role, router]);

  if (!role) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <PageHeader
        className="shrink-0"
        title={role.Name}
        description={role.Description || "Update this role and its permissions"}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <RolePermissionForm
          key={role.Id + role.Permissions.join(",")}
          mode="edit"
          initialName={role.Name}
          initialDescription={role.Description}
          initialPermissions={role.Permissions}
          readOnly={role.IsLocked || !canUpdate}
          onSubmit={({ Name, Description, Permissions }) => {
            const taken = roles.some(
              (item) =>
                item.Id !== role.Id &&
                item.Name.toLowerCase() === Name.toLowerCase(),
            );
            if (taken) {
              toast.error("A role with this name already exists.");
              return;
            }
            updateRole(role.Id, { Name, Description, Permissions });
            toast.success("Role updated.");
            router.push("/account/roles-and-permissions");
          }}
        />
      </div>
    </div>
  );
}
