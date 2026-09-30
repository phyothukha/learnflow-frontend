"use client";

import {
  Archive,
  CheckCircle2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Star,
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
import { usePlannerStore } from "@/store/client/planner-store";
import {
  GoalFocus,
  GoalStatus,
  type Goal,
} from "@/store/server/goals/interface";

export interface GoalActionsMenuProps {
  goal: Goal;
  onEdit: () => void;
  onDeleted?: () => void;
}

export function GoalActionsMenu({
  goal,
  onEdit,
  onDeleted,
}: GoalActionsMenuProps) {
  const setGoalStatus = usePlannerStore((state) => state.setGoalStatus);
  const setPrimaryGoal = usePlannerStore((state) => state.setPrimaryGoal);
  const deleteGoal = usePlannerStore((state) => state.deleteGoal);
  const { confirm, confirmDelete, dialogProps } = useConfirmDialog();

  const changeStatus = (status: GoalStatus, message: string) => {
    setGoalStatus(goal.Id, status);
    toast.success(message);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="subtle"
            size="icon-sm"
            aria-label={`Actions for ${goal.Title}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit goal
          </DropdownMenuItem>
          {goal.Focus !== GoalFocus.Primary &&
            goal.Status === GoalStatus.Active && (
              <DropdownMenuItem
                onSelect={() => {
                  setPrimaryGoal(goal.Id);
                  toast.success(`"${goal.Title}" is now your primary goal.`);
                }}
              >
                <Star /> Set as primary
              </DropdownMenuItem>
            )}
          <DropdownMenuSeparator />
          {goal.Status === GoalStatus.Active ? (
            <DropdownMenuItem
              onSelect={() =>
                changeStatus(
                  GoalStatus.Paused,
                  "Goal paused. Its tasks won't be scheduled.",
                )
              }
            >
              <Pause /> Pause
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() =>
                changeStatus(GoalStatus.Active, "Goal is active again.")
              }
            >
              <Play />{" "}
              {goal.Status === GoalStatus.Paused ? "Resume" : "Reactivate"}
            </DropdownMenuItem>
          )}
          {goal.Status !== GoalStatus.Completed && (
            <DropdownMenuItem
              onSelect={() =>
                void confirm({
                  title: `Mark "${goal.Title}" as completed?`,
                  description: "Remaining tasks will no longer be scheduled.",
                  confirmText: "Complete goal",
                  icon: CheckCircle2,
                  onConfirm: () => setGoalStatus(goal.Id, GoalStatus.Completed),
                  successMessage: "Congratulations on finishing your goal!",
                })
              }
            >
              <CheckCircle2 /> Mark completed
            </DropdownMenuItem>
          )}
          {goal.Status !== GoalStatus.Archived && (
            <DropdownMenuItem
              onSelect={() =>
                changeStatus(GoalStatus.Archived, "Goal archived.")
              }
            >
              <Archive /> Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() =>
              void confirmDelete({
                itemName: goal.Title,
                description:
                  "Its milestones, tasks and scheduled sessions will be deleted too.",
                onConfirm: () => {
                  deleteGoal(goal.Id);
                  onDeleted?.();
                },
                successMessage: "Goal deleted.",
              })
            }
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
