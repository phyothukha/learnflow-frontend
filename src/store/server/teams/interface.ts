export enum TeamMemberRole {
  Owner = "Owner",
  Member = "Member",
}

export interface TeamMember {
  LearnerId: string;
  Name: string;
  Email: string;
  Role: TeamMemberRole;
  /** Admin-granted: can read/write this team's shared notes. */
  CanAccessNotes: boolean;
  JoinedAt: string;
}

export interface Team {
  Id: string;
  Name: string;
  Description: string | null;
  Color: string;
  Members: TeamMember[];
  CreatedAt: string;
  UpdatedAt: string;
}

export type TeamInput = Omit<
  Team,
  "Id" | "Members" | "CreatedAt" | "UpdatedAt"
>;

export interface AddTeamMemberInput {
  LearnerId: string;
  Name: string;
  Email: string;
  CanAccessNotes: boolean;
  Role?: TeamMemberRole;
}
