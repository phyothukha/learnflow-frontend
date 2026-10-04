import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  TeamMemberRole,
  type AddTeamMemberInput,
  type Team,
  type TeamInput,
  type TeamMember,
} from "@/store/server/teams/interface";
import { TEAM_COLORS } from "@/lib/team-meta";

/** Demo identity placeholder (admin manages teams; not a learner member). */
export const CURRENT_USER_ID = "user-me";
export const CURRENT_USER_NAME = "You";
export const CURRENT_USER_EMAIL = "you@learnflow.app";

export interface TeamsData {
  teams: Team[];
}

export interface TeamsActions {
  createTeam: (input: TeamInput) => string;
  updateTeam: (id: string, patch: Partial<TeamInput>) => void;
  deleteTeam: (id: string) => void;
  addMember: (teamId: string, input: AddTeamMemberInput) => void;
  setMemberNotesAccess: (
    teamId: string,
    learnerId: string,
    canAccessNotes: boolean,
  ) => void;
  removeMember: (teamId: string, learnerId: string) => void;
  resetDemo: () => void;
}

export type TeamsState = TeamsData & TeamsActions;

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function member(
  LearnerId: string,
  Name: string,
  Email: string,
  Role: TeamMemberRole,
  CanAccessNotes: boolean,
  joinedDaysAgo: number,
): TeamMember {
  return {
    LearnerId,
    Name,
    Email,
    Role,
    CanAccessNotes,
    JoinedAt: new Date(
      Date.now() - joinedDaysAgo * 24 * 60 * 60 * 1000,
    ).toISOString(),
  };
}

export function createTeamsSeed(): TeamsData {
  return {
    teams: [
      {
        Id: "team-jlpt",
        Name: "JLPT Study Circle",
        Description: "Shared prep for N2 / N3 — grammar, kanji and mocks.",
        Logo: null,
        Color: TEAM_COLORS[0],
        Members: [
          member(
            "l-01",
            "Aye Chan",
            "aye.chan@example.com",
            TeamMemberRole.Member,
            true,
            30,
          ),
          member(
            "l-03",
            "Su Myat",
            "su.myat@example.com",
            TeamMemberRole.Member,
            true,
            20,
          ),
          member(
            "l-07",
            "Phyo Wai",
            "phyo.wai@example.com",
            TeamMemberRole.Member,
            false,
            10,
          ),
        ],
        CreatedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        UpdatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        Id: "team-fe",
        Name: "ITPEC FE Crew",
        Description: "Fundamentals exam practice and past papers.",
        Logo: null,
        Color: TEAM_COLORS[1],
        Members: [
          member(
            "l-02",
            "Min Thu",
            "min.thu@example.com",
            TeamMemberRole.Member,
            true,
            35,
          ),
          member(
            "l-04",
            "Htet Aung",
            "htet.aung@example.com",
            TeamMemberRole.Member,
            true,
            15,
          ),
        ],
        CreatedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
        UpdatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        Id: "team-react",
        Name: "React Builders",
        Description: "Portfolio projects and weekly code review.",
        Logo: null,
        Color: TEAM_COLORS[4],
        Members: [
          member(
            "l-04",
            "Htet Aung",
            "htet.aung@example.com",
            TeamMemberRole.Member,
            true,
            18,
          ),
          member(
            "l-05",
            "Nandar Win",
            "nandar.win@example.com",
            TeamMemberRole.Member,
            false,
            12,
          ),
        ],
        CreatedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
        UpdatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  };
}

export const useTeamsStore = create<TeamsState>()(
  persist(
    (set, get) => ({
      ...createTeamsSeed(),

      createTeam: (input) => {
        const id = createId("team");
        const now = new Date().toISOString();
        set((state) => ({
          teams: [
            {
              ...input,
              Id: id,
              Members: [],
              CreatedAt: now,
              UpdatedAt: now,
            },
            ...state.teams,
          ],
        }));
        return id;
      },

      updateTeam: (id, patch) =>
        set((state) => ({
          teams: state.teams.map((team) =>
            team.Id === id
              ? { ...team, ...patch, UpdatedAt: new Date().toISOString() }
              : team,
          ),
        })),

      deleteTeam: (id) =>
        set((state) => ({
          teams: state.teams.filter((team) => team.Id !== id),
        })),

      addMember: (teamId, input) => {
        const existing = get().teams.find((team) => team.Id === teamId);
        if (!existing) return;
        if (existing.Members.some((m) => m.LearnerId === input.LearnerId))
          return;
        set((state) => ({
          teams: state.teams.map((team) =>
            team.Id !== teamId
              ? team
              : {
                  ...team,
                  UpdatedAt: new Date().toISOString(),
                  Members: [
                    ...team.Members,
                    member(
                      input.LearnerId,
                      input.Name,
                      input.Email,
                      input.Role ?? TeamMemberRole.Member,
                      input.CanAccessNotes,
                      0,
                    ),
                  ],
                },
          ),
        }));
      },

      setMemberNotesAccess: (teamId, learnerId, canAccessNotes) =>
        set((state) => ({
          teams: state.teams.map((team) =>
            team.Id !== teamId
              ? team
              : {
                  ...team,
                  UpdatedAt: new Date().toISOString(),
                  Members: team.Members.map((item) =>
                    item.LearnerId === learnerId
                      ? { ...item, CanAccessNotes: canAccessNotes }
                      : item,
                  ),
                },
          ),
        })),

      removeMember: (teamId, learnerId) =>
        set((state) => ({
          teams: state.teams.map((team) => {
            if (team.Id !== teamId) return team;
            const next = team.Members.filter((m) => m.LearnerId !== learnerId);
            if (next.length === team.Members.length) return team;
            return {
              ...team,
              Members: next,
              UpdatedAt: new Date().toISOString(),
            };
          }),
        })),

      resetDemo: () => set(createTeamsSeed()),
    }),
    {
      name: "learnflow-teams",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ teams }): TeamsData => ({ teams }),
      migrate: (persisted) => {
        const data = persisted as TeamsData;
        return {
          teams: (data.teams ?? []).map((team) => ({
            ...team,
            Logo:
              team.Logo &&
              (team.Logo.startsWith("data:image/") ||
                team.Logo.startsWith("http://") ||
                team.Logo.startsWith("https://") ||
                team.Logo.startsWith("/"))
                ? team.Logo
                : null,
            Members: (team.Members ?? []).map((item) => ({
              ...item,
              CanAccessNotes:
                typeof item.CanAccessNotes === "boolean"
                  ? item.CanAccessNotes
                  : true,
            })),
          })),
        };
      },
    },
  ),
);

export function isTeamMember(team: Team, learnerId = CURRENT_USER_ID) {
  return team.Members.some((item) => item.LearnerId === learnerId);
}

export function canAccessTeamNotes(team: Team, learnerId = CURRENT_USER_ID) {
  return team.Members.some(
    (item) => item.LearnerId === learnerId && item.CanAccessNotes,
  );
}

export function notesAccessibleTeamIds(
  teams: Team[],
  learnerId = CURRENT_USER_ID,
) {
  return new Set(
    teams
      .filter((team) => canAccessTeamNotes(team, learnerId))
      .map((team) => team.Id),
  );
}
