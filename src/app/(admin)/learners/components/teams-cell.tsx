"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspaceNotesHydration } from "@/hooks/use-workspace-notes-hydration";
import { useTeamsStore } from "@/store/client/teams-store";
import type { Team } from "@/store/server/teams/interface";

const VISIBLE = 2;

export function TeamsCell({ learnerId }: { learnerId: string }) {
  const ready = useWorkspaceNotesHydration();
  const allTeams = useTeamsStore((state) => state.teams);
  const teams = useMemo(
    () =>
      allTeams.filter((team) =>
        team.Members.some((member) => member.LearnerId === learnerId),
      ),
    [allTeams, learnerId],
  );

  if (!ready) {
    return <span className="text-muted-foreground">…</span>;
  }

  if (teams.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = teams.slice(0, VISIBLE);
  const rest = teams.slice(VISIBLE);

  return (
    <TooltipProvider>
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {visible.map((team) => (
          <TeamChip key={team.Id} team={team} />
        ))}
        {rest.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-6 items-center rounded-full border bg-muted/50 px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted"
              >
                +{rest.length}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <ul className="space-y-1">
                {rest.map((team) => (
                  <li
                    key={team.Id}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: team.Color }}
                    />
                    {team.Name}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

function TeamChip({ team }: { team: Team }) {
  return (
    <Link
      href={`/teams/${team.Id}`}
      className="inline-flex max-w-[9rem] items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-muted"
      title={team.Name}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: team.Color }}
      />
      <span className="truncate">{team.Name}</span>
    </Link>
  );
}
