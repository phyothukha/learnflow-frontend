"use client";

import Link from "next/link";
import {
  Ban,
  BookPlus,
  CircleCheck,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
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
import {
  MemberStatus,
  useMembersStore,
  type Member,
} from "@/store/client/mock/members-store";
import { MembersDialogType, useMembers } from "../context/members-context";

export function DataTableRowActions({ member }: { member: Member }) {
  const { openDialog } = useMembers();
  const { hasPermission } = usePermission();
  const setStatus = useMembersStore((state) => state.setStatus);
  const deleteMember = useMembersStore((state) => state.deleteMember);
  const { confirmDelete, dialogProps } = useConfirmDialog();

  const canUpdate = hasPermission(PERMISSIONS.MEMBERS_UPDATE);
  const canEnroll = hasPermission(PERMISSIONS.ENROLLMENTS_CREATE);
  const canDelete = hasPermission(PERMISSIONS.MEMBERS_DELETE);
  const isDisabled = member.Status === MemberStatus.Disabled;

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
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/members/${member.Id}`}>
              <Eye />
              View member
            </Link>
          </DropdownMenuItem>
          {canUpdate && (
            <DropdownMenuItem asChild>
              <Link href={`/members/${member.Id}/edit`}>
                <Pencil />
                Edit member
              </Link>
            </DropdownMenuItem>
          )}
          {canEnroll && (
            <DropdownMenuItem
              disabled={isDisabled}
              onClick={() => openDialog(MembersDialogType.Enroll, member.Id)}
            >
              <BookPlus />
              Enroll member
            </DropdownMenuItem>
          )}
          {canUpdate && (
            <DropdownMenuItem
              onClick={() => {
                const next = isDisabled
                  ? MemberStatus.Active
                  : MemberStatus.Disabled;
                setStatus(member.Id, next);
                toast.success(
                  isDisabled ? "Member enabled." : "Member disabled.",
                );
              }}
            >
              {isDisabled ? <CircleCheck /> : <Ban />}
              {isDisabled ? "Enable member" : "Disable member"}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete member?",
                    description: `This will permanently remove ${member.Name} and their enrollments. This action cannot be undone.`,
                    successMessage: "Member deleted.",
                    onConfirm: () => deleteMember(member.Id),
                  })
                }
              >
                <Trash2 />
                Delete member
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
