"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import { ArrowLeft, NotebookPen, UserMinus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePermission } from "@/hooks/use-permission";
import { useWorkspaceNotesHydration } from "@/hooks/use-workspace-notes-hydration";
import { PERMISSIONS } from "@/lib/permissions";
import { useTeamsStore } from "@/store/client/teams-store";
import { AddMembersDialog } from "../components/add-members-dialog";

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = use(params);
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.TEAMS_VIEW);
  const canUpdate = hasPermission(PERMISSIONS.TEAMS_UPDATE);
  const ready = useWorkspaceNotesHydration();
  const team = useTeamsStore((state) =>
    state.teams.find((item) => item.Id === teamId),
  );
  const removeMember = useTeamsStore((state) => state.removeMember);
  const setMemberNotesAccess = useTeamsStore(
    (state) => state.setMemberNotesAccess,
  );

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView || !ready) return null;

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="subtle" size="icon" className="size-9" asChild>
            <Link href="/teams">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: team.Color }}
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
        {canUpdate && <AddMembersDialog team={team} />}
      </div>

      <section className="library-card space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Learners</h2>
          <p className="text-xs text-muted-foreground">
            You control membership and notes access — team notes stay private to
            learners.
          </p>
        </div>
        {team.Members.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No learners yet. Add someone with their email.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {team.Members.map((member) => (
              <li
                key={member.LearnerId}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: team.Color }}
                >
                  {member.Name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.Name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.Email} · added{" "}
                    {dayjs(member.JoinedAt).format("MMM D")}
                  </p>
                </div>
                {canUpdate ? (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={member.CanAccessNotes}
                      onCheckedChange={(checked) => {
                        setMemberNotesAccess(
                          team.Id,
                          member.LearnerId,
                          checked,
                        );
                        toast.success(
                          checked
                            ? `${member.Name} can access team notes.`
                            : `${member.Name} no longer has notes access.`,
                        );
                      }}
                    />
                    Notes
                  </label>
                ) : (
                  <Badge
                    variant={member.CanAccessNotes ? "status-green" : "outline"}
                  >
                    {member.CanAccessNotes ? "Notes" : "No notes"}
                  </Badge>
                )}
                {canUpdate && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${member.Name}`}
                    onClick={() => {
                      removeMember(team.Id, member.LearnerId);
                      toast.success(`${member.Name} removed.`);
                    }}
                  >
                    <UserMinus />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
