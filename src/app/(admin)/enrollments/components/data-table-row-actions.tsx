"use client";

import type { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import type { Enrollment } from "@/store/server/enrollments/interface";
import { useDeleteEnrollment } from "@/store/server/enrollments/mutations";
import {
  EnrollmentsDialogType,
  useEnrollments,
} from "../context/enrollments-context";

interface DataTableRowActionsProps {
  row: Row<Enrollment>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const enrollment = row.original;
  const { setOpen, setCurrentRow } = useEnrollments();
  const { hasPermission } = usePermission();
  const { mutateAsync: deleteEnrollment } = useDeleteEnrollment();
  const { confirmDelete, dialogProps } = useConfirmDialog();

  const canUpdate = hasPermission(PERMISSIONS.ENROLLMENTS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ENROLLMENTS_DELETE);
  if (!canUpdate && !canDelete) return null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canUpdate && (
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(enrollment);
                setOpen(EnrollmentsDialogType.Edit);
              }}
            >
              <Pencil />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                confirmDelete({
                  title: "Delete enrollment?",
                  description: `This will permanently remove ${enrollment.StudentName}'s enrollment. This action cannot be undone.`,
                  successMessage: "Enrollment deleted.",
                  errorMessage: "Failed to delete enrollment.",
                  onConfirm: () => deleteEnrollment(enrollment.Id),
                })
              }
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
