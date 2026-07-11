import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client-side workspace state: the active topic context that filters the
 * note-taking area / library, and the audio notification preference.
 * Persisted so a refresh doesn't lose the user's context.
 */
interface WorkspaceState {
  activeTopicId: string | null;
  soundMuted: boolean;
  setActiveTopic: (id: string | null) => void;
  toggleSoundMuted: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeTopicId: null,
      soundMuted: false,
      setActiveTopic: (id) => set({ activeTopicId: id }),
      toggleSoundMuted: () => set((s) => ({ soundMuted: !s.soundMuted })),
    }),
    { name: "learnflow-workspace" },
  ),
);
