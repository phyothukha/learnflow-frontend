"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UsersRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { usePermission } from "@/hooks/use-permission";
import { useWorkspaceNotesHydration } from "@/hooks/use-workspace-notes-hydration";
import { PERMISSIONS } from "@/lib/permissions";
import { useNotesStore } from "@/store/client/notes-store";
import { useTeamsStore } from "@/store/client/teams-store";
import { NoteVisibility } from "@/store/server/notes/interface";
import { CreateTeamDialog } from "./components/create-team-dialog";
import { TeamCard } from "./components/team-card";

export default function TeamsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.TEAMS_VIEW);
  const canCreate = hasPermission(PERMISSIONS.TEAMS_CREATE);
  const ready = useWorkspaceNotesHydration();
  const teams = useTeamsStore((state) => state.teams);
  const notes = useNotesStore((state) => state.notes);
  const [search, setSearch] = useState("");

  const notesByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of notes) {
      if (note.Visibility !== NoteVisibility.Team || !note.TeamId) continue;
      map.set(note.TeamId, (map.get(note.TeamId) ?? 0) + 1);
    }
    return map;
  }, [notes]);

  const query = search.trim().toLowerCase();
  const visibleTeams = useMemo(() => {
    if (!query) return teams;
    return teams.filter(
      (team) =>
        team.Name.toLowerCase().includes(query) ||
        team.Description?.toLowerCase().includes(query),
    );
  }, [teams, query]);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView || !ready) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <PageHeader
        title="Teams"
        description="Create teams and add learners. Learners share notes among themselves."
        badge={
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary tabular-nums">
            {teams.length} teams
          </span>
        }
        actions={canCreate ? <CreateTeamDialog /> : undefined}
      />

      {teams.length > 0 ? (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search teams by name or description…"
        />
      ) : null}

      {teams.length === 0 ? (
        <div className="library-card flex flex-col items-center gap-2 px-4 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <UsersRound className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No teams yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Create a team to start adding learners by email.
          </p>
        </div>
      ) : visibleTeams.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No teams match “{search.trim()}”.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTeams.map((team) => (
            <TeamCard
              key={team.Id}
              team={team}
              notesCount={notesByTeam.get(team.Id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
