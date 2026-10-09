"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, NotebookPen, Trash2, UsersRound } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TeamLogo } from "@/components/team-logo";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { usePermission } from "@/hooks/use-permission";
import { useWorkspaceNotesHydration } from "@/hooks/use-workspace-notes-hydration";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { useTeamsStore } from "@/store/client/teams-store";
import { AddMembersDialog } from "../components/add-members-dialog";
import { MembersTable } from "../components/members-table";

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canView = useRequirePermission(PERMISSIONS.TEAMS_VIEW);
  const canUpdate = hasPermission(PERMISSIONS.TEAMS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.TEAMS_DELETE);
  const ready = useWorkspaceNotesHydration();
  const team = useTeamsStore((state) =>
    state.teams.find((item) => item.Id === teamId),
  );
  const deleteTeam = useTeamsStore((state) => state.deleteTeam);
  const { confirmDelete, dialogProps } = useConfirmDialog();

  if (!canView || !ready) return null;

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm font-medium">Team not found</p>
        <Button variant="subtle" asChild>
          <Link href="/teams">Back to teams</Link>
        </Button>
      </div>
    );
  }

  const notesAccessCount = team.Members.filter((m) => m.CanAccessNotes).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="subtle" size="icon" className="size-9" asChild>
            <Link href="/teams">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <TeamLogo
                name={team.Name}
                color={team.Color}
                logo={team.Logo}
                className="size-9 rounded-xl"
              />
              <h1 className="text-xl font-semibold tracking-tight">
                {team.Name}
              </h1>
            </div>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {team.Description || "No description"}
            </p>
            <p className="mt-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <UsersRound className="size-3.5" />
                {team.Members.length}{" "}
                {team.Members.length === 1 ? "learner" : "learners"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <NotebookPen className="size-3.5" />
                {notesAccessCount} with notes access
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && <AddMembersDialog team={team} />}
          {canDelete && (
            <Button
              variant="outline"
              onClick={() =>
                void confirmDelete({
                  title: "Delete team?",
                  description: `This will permanently delete ${team.Name} and remove all members from it. This action cannot be undone.`,
                  confirmText: "Delete team",
                  successMessage: "Team deleted.",
                  onConfirm: () => {
                    deleteTeam(team.Id);
                    router.push("/teams");
                  },
                })
              }
            >
              <Trash2 />
              Delete team
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <MembersTable team={team} canUpdate={canUpdate} />
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
