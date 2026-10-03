import { NoteVisibility } from "@/store/server/notes/interface";
import { TeamMemberRole } from "@/store/server/teams/interface";

export const TEAM_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#64748b",
] as const;

export const TEAM_MEMBER_ROLES = new Map<TeamMemberRole, string>([
  [TeamMemberRole.Owner, "Owner"],
  [TeamMemberRole.Member, "Member"],
]);

export const NOTE_VISIBILITY = new Map<
  NoteVisibility,
  { label: string; hint: string }
>([
  [
    NoteVisibility.Private,
    { label: "Private", hint: "Only you can see this note" },
  ],
  [
    NoteVisibility.Team,
    {
      label: "Team",
      hint: "Only members with notes access can open this note",
    },
  ],
]);
