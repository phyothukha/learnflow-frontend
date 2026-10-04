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
  LearnerStatus,
  useLearnersStore,
  type Learner,
} from "@/store/client/mock/learners-store";
import { LearnersDialogType, useLearners } from "../context/learners-context";

export function DataTableRowActions({ learner }: { learner: Learner }) {
  const { openDialog } = useLearners();
  const { hasPermission } = usePermission();
  const setStatus = useLearnersStore((state) => state.setStatus);
  const deleteLearner = useLearnersStore((state) => state.deleteLearner);
  const { confirmDelete, dialogProps } = useConfirmDialog();

  const canUpdate = hasPermission(PERMISSIONS.LEARNERS_UPDATE);
  const canEnroll = hasPermission(PERMISSIONS.ENROLLMENTS_CREATE);
  const canDelete = hasPermission(PERMISSIONS.LEARNERS_DELETE);
  const isDisabled = learner.Status === LearnerStatus.Disabled;

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
            <Link href={`/learners/${learner.Id}`}>
              <Eye />
              View learner
            </Link>
          </DropdownMenuItem>
          {canUpdate && (
            <DropdownMenuItem asChild>
              <Link href={`/learners/${learner.Id}/edit`}>
                <Pencil />
                Edit learner
              </Link>
            </DropdownMenuItem>
          )}
          {canEnroll && (
            <DropdownMenuItem
              disabled={isDisabled}
              onClick={() => openDialog(LearnersDialogType.Enroll, learner.Id)}
            >
              <BookPlus />
              Enroll learner
            </DropdownMenuItem>
          )}
          {canUpdate && (
            <DropdownMenuItem
              onClick={() => {
                const next = isDisabled
                  ? LearnerStatus.Active
                  : LearnerStatus.Disabled;
                setStatus(learner.Id, next);
                toast.success(
                  isDisabled ? "Learner enabled." : "Learner disabled.",
                );
              }}
            >
              {isDisabled ? <CircleCheck /> : <Ban />}
              {isDisabled ? "Enable learner" : "Disable learner"}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete learner?",
                    description: `This will permanently remove ${learner.Name} and their enrollments. This action cannot be undone.`,
                    successMessage: "Learner deleted.",
                    onConfirm: () => deleteLearner(learner.Id),
                  })
                }
              >
                <Trash2 />
                Delete learner
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
