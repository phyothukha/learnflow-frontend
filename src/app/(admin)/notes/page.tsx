"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Lock, NotebookPen, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { useWorkspaceNotesHydration } from "@/hooks/use-workspace-notes-hydration";
import { PERMISSIONS } from "@/lib/permissions";
import { accessibleNotes, useNotesStore } from "@/store/client/notes-store";
import {
  CURRENT_USER_ID,
  isTeamMember,
  useTeamsStore,
} from "@/store/client/teams-store";
import { NoteVisibility } from "@/store/server/notes/interface";

function NotesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.NOTES_VIEW);
  const canCreate = hasPermission(PERMISSIONS.NOTES_CREATE);
  const ready = useWorkspaceNotesHydration();
  const notes = useNotesStore((state) => state.notes);
  const createNote = useNotesStore((state) => state.createNote);
  const teams = useTeamsStore((state) => state.teams);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView || !ready) return null;

  const teamFilter = searchParams.get("team");
  const joinedIds = new Set(
    teams.filter((team) => isTeamMember(team)).map((team) => team.Id),
  );
  const visible = accessibleNotes(notes, joinedIds);
  const team = teamFilter ? teams.find((item) => item.Id === teamFilter) : null;

  const create = (visibility: NoteVisibility, teamId: string | null) => {
    const id = createNote({
      Title: "Untitled note",
      Content: null,
      Visibility: visibility,
      TeamId: teamId,
      OwnerId: CURRENT_USER_ID,
      OwnerName: "You",
    });
    router.push(`/notes/${id}`);
  };

  return (
    <div className="library-card flex h-full min-h-0 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <NotebookPen className="size-8" />
      <p className="text-sm font-medium text-foreground">
        {visible.length === 0 ? "No notes yet" : "Select a note"}
      </p>
      <p className="max-w-sm text-xs">
        {team
          ? `Notes shared with ${team.Name}. Everyone in the team can open them in LearnFlow Learner too.`
          : "Create a private note for yourself, or a team note that members can access."}
      </p>
      {canCreate && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {team && joinedIds.has(team.Id) ? (
            <Button onClick={() => create(NoteVisibility.Team, team.Id)}>
              <UsersRound /> New team note
            </Button>
          ) : (
            <>
              <Button onClick={() => create(NoteVisibility.Private, null)}>
                <Lock /> Private note
              </Button>
              {joinedIds.size > 0 && (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/teams">Pick a team</Link>
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesPageInner />
    </Suspense>
  );
}
