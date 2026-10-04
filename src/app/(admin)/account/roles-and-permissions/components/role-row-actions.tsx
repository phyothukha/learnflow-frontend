"use client";

import Link from "next/link";
import { KeyRound, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useAdminUsersStore } from "@/store/client/mock/admin-users-store";
import { useLearnersStore } from "@/store/client/mock/learners-store";
import {
  LEARNER_ROLE_ID,
  useRolesStore,
  type Role,
} from "@/store/client/mock/roles-store";

export function RoleRowActions({ role }: { role: Role }) {
  const deleteRole = useRolesStore((state) => state.deleteRole);
  const adminUsers = useAdminUsersStore((state) => state.users);
  const learners = useLearnersStore((state) => state.learners);
  const { hasPermission } = usePermission();
  const canDelete = hasPermission(PERMISSIONS.ROLES_DELETE);
  const { confirmDelete, dialogProps } = useConfirmDialog();

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 data-[state=open]:bg-muted"
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/account/roles-and-permissions/${role.Id}`}>
              <KeyRound />
              Edit role
            </Link>
          </DropdownMenuItem>
          {canDelete && !role.IsSystem ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  const members =
                    role.Id === LEARNER_ROLE_ID
                      ? learners.filter((user) => user.RoleId === role.Id)
                          .length
                      : adminUsers.filter((user) => user.RoleId === role.Id)
                          .length;
                  if (members > 0) {
                    toast.error("Move users on this role before deleting it.");
                    return;
                  }
                  void confirmDelete({
                    title: "Delete role?",
                    description: `"${role.Name}" will be removed. This action cannot be undone.`,
                    successMessage: "Role deleted.",
                    onConfirm: () => deleteRole(role.Id),
                  });
                }}
              >
                <Trash2 />
                Delete role
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
