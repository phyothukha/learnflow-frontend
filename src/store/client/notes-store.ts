import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  NoteVisibility,
  type WorkspaceNote,
  type WorkspaceNoteInput,
} from "@/store/server/notes/interface";
import { CURRENT_USER_ID, CURRENT_USER_NAME } from "@/store/client/teams-store";

export interface NotesData {
  notes: WorkspaceNote[];
}

export interface NotesActions {
  createNote: (input: WorkspaceNoteInput) => string;
  updateNote: (
    id: string,
    patch: Partial<
      Pick<WorkspaceNote, "Title" | "Content" | "Visibility" | "TeamId">
    >,
  ) => void;
  deleteNote: (id: string) => void;
  resetDemo: () => void;
}

export type NotesState = NotesData & NotesActions;

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export function createNotesSeed(): NotesData {
  return {
    notes: [
      {
        Id: "wn-1",
        Title: "Evening study checklist",
        Content:
          "## Tonight\n\n- [ ] 30m kanji flashcards\n- [ ] 1 grammar chapter\n- [ ] Review mistakes\n",
        Visibility: NoteVisibility.Private,
        TeamId: null,
        OwnerId: CURRENT_USER_ID,
        OwnerName: CURRENT_USER_NAME,
        CreatedAt: daysAgo(5),
        UpdatedAt: daysAgo(0),
      },
      {
        Id: "wn-2",
        Title: "Personal FE weak topics",
        Content:
          "Focus areas:\n\n1. Data structures\n2. Networking ports\n3. Security fundamentals\n",
        Visibility: NoteVisibility.Private,
        TeamId: null,
        OwnerId: CURRENT_USER_ID,
        OwnerName: CURRENT_USER_NAME,
        CreatedAt: daysAgo(12),
        UpdatedAt: daysAgo(3),
      },
      {
        Id: "wn-3",
        Title: "N4 grammar summary",
        Content:
          "# N4 grammar\n\n## 〜てしまう\nCompletion / regret.\n\n## 〜ようと思う\nIntention.\n\nShare with the circle before Sunday mock.\n",
        Visibility: NoteVisibility.Team,
        TeamId: "team-jlpt",
        OwnerId: CURRENT_USER_ID,
        OwnerName: CURRENT_USER_NAME,
        CreatedAt: daysAgo(8),
        UpdatedAt: daysAgo(1),
      },
      {
        Id: "wn-4",
        Title: "Kanji set 2 tips",
        Content:
          "Aye Chan's tips:\n\n- Group by radical\n- Write each 5×\n- Self-test every Friday\n",
        Visibility: NoteVisibility.Team,
        TeamId: "team-jlpt",
        OwnerId: "l-01",
        OwnerName: "Aye Chan",
        CreatedAt: daysAgo(6),
        UpdatedAt: daysAgo(2),
      },
      {
        Id: "wn-5",
        Title: "Past paper 2024 Spring notes",
        Content:
          "## Score target\n\n- Morning: 60%\n- Afternoon: review wrong answers\n\n## Tricky questions\n\n- Q14 binary conversion\n- Q31 OSI layers\n",
        Visibility: NoteVisibility.Team,
        TeamId: "team-fe",
        OwnerId: "l-02",
        OwnerName: "Min Thu",
        CreatedAt: daysAgo(4),
        UpdatedAt: daysAgo(1),
      },
      {
        Id: "wn-6",
        Title: "Portfolio layout checklist",
        Content:
          "React Builders shared list:\n\n- [ ] Hero\n- [ ] Projects grid\n- [ ] Deploy to Vercel\n",
        Visibility: NoteVisibility.Team,
        TeamId: "team-react",
        OwnerId: "l-04",
        OwnerName: "Htet Aung",
        CreatedAt: daysAgo(9),
        UpdatedAt: daysAgo(4),
      },
    ],
  };
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      ...createNotesSeed(),

      createNote: (input) => {
        const id = createId("wn");
        const now = new Date().toISOString();
        set((state) => ({
          notes: [
            {
              ...input,
              Id: id,
              CreatedAt: now,
              UpdatedAt: now,
            },
            ...state.notes,
          ],
        }));
        return id;
      },

      updateNote: (id, patch) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.Id === id
              ? { ...note, ...patch, UpdatedAt: new Date().toISOString() }
              : note,
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.Id !== id),
        })),

      resetDemo: () => set(createNotesSeed()),
    }),
    {
      name: "learnflow-workspace-notes",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ notes }): NotesData => ({ notes }),
    },
  ),
);

/**
 * Notes the current user may open: own private notes, plus team notes only for
 * teams where admin granted CanAccessNotes.
 */
export function accessibleNotes(
  notes: WorkspaceNote[],
  notesTeamIds: Set<string>,
  userId = CURRENT_USER_ID,
) {
  return notes.filter((note) => {
    if (note.Visibility === NoteVisibility.Private)
      return note.OwnerId === userId;
    return !!note.TeamId && notesTeamIds.has(note.TeamId);
  });
}

export function privateNotes(notes: WorkspaceNote[], userId = CURRENT_USER_ID) {
  return notes.filter(
    (note) =>
      note.Visibility === NoteVisibility.Private && note.OwnerId === userId,
  );
}
