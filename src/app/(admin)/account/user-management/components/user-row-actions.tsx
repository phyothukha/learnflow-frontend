"use client";

import Link from "next/link";
import { Ban, CircleCheck, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ConfirmDialogVariant,
  useConfirmDialog,
} from "@/hooks/use-confirm-dialog";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import {
  AdminUserStatus,
  useAdminUsersStore,
  type AdminUser,
} from "@/store/client/mock/admin-users-store";

export function UserRowActions({ user }: { user: AdminUser }) {
  const setStatus = useAdminUsersStore((state) => state.setStatus);
  const deleteUser = useAdminUsersStore((state) => state.deleteUser);
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(PERMISSIONS.ROLES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ROLES_DELETE);
  const { confirm, confirmDelete, dialogProps } = useConfirmDialog();
  const isDisabled = user.Status === AdminUserStatus.Disabled;

  if (!canUpdate && !canDelete) return null;

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
          {canUpdate ? (
            <DropdownMenuItem asChild>
              <Link href={`/account/user-management/${user.Id}/edit`}>
                <Pencil />
                Edit user
              </Link>
            </DropdownMenuItem>
          ) : null}
          {canUpdate ? (
            <DropdownMenuItem
              onClick={() => {
                void confirm({
                  title: isDisabled ? "Enable user?" : "Suspend user?",
                  description: isDisabled
                    ? `${user.Name || user.Email} will be able to sign in again.`
                    : `${user.Name || user.Email} will no longer be able to sign in.`,
                  confirmText: isDisabled ? "Enable user" : "Suspend user",
                  variant: isDisabled
                    ? ConfirmDialogVariant.Default
                    : ConfirmDialogVariant.Destructive,
                  successMessage: isDisabled
                    ? "User enabled."
                    : "User suspended.",
                  onConfirm: () =>
                    setStatus(
                      user.Id,
                      isDisabled
                        ? AdminUserStatus.Active
                        : AdminUserStatus.Disabled,
                    ),
                });
              }}
            >
              {isDisabled ? <CircleCheck /> : <Ban />}
              {isDisabled ? "Enable user" : "Suspend user"}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  void confirmDelete({
                    title: "Delete user?",
                    description: `This will permanently remove ${user.Name || user.Email}. This action cannot be undone.`,
                    successMessage: "User deleted.",
                    onConfirm: () => deleteUser(user.Id),
                  })
                }
              >
                <Trash2 />
                Delete user
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
