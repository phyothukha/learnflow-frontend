import Cookies from "js-cookie";
import type { StateCreator } from "zustand";

export const WORKSPACE_COOKIE = "learnflow-workspace";

/**
 * The active topic context that filters the note-taking area / library,
 * and the audio notification preference.
 */
export interface WorkspaceSlice {
  activeTopicId: string | null;
  soundMuted: boolean;
  setActiveTopic: (id: string | null) => void;
  toggleSoundMuted: () => void;
}

type WorkspaceCookie = Pick<WorkspaceSlice, "activeTopicId" | "soundMuted">;

function readWorkspaceCookie(): WorkspaceCookie {
  const fallback: WorkspaceCookie = { activeTopicId: null, soundMuted: false };
  const cookieState = Cookies.get(WORKSPACE_COOKIE);
  if (!cookieState) return fallback;
  try {
    const parsed = JSON.parse(cookieState) as Partial<WorkspaceCookie>;
    return {
      activeTopicId:
        typeof parsed.activeTopicId === "string" ? parsed.activeTopicId : null,
      soundMuted: parsed.soundMuted === true,
    };
  } catch {
    return fallback;
  }
}

function writeWorkspaceCookie(value: WorkspaceCookie) {
  Cookies.set(WORKSPACE_COOKIE, JSON.stringify(value), {
    expires: 365,
    path: "/",
    sameSite: "lax",
  });
}

const createWorkspaceSlice: StateCreator<WorkspaceSlice> = (set, get) => {
  const save = (patch: Partial<WorkspaceCookie>) => {
    const { activeTopicId, soundMuted } = get();
    const next = { activeTopicId, soundMuted, ...patch };
    writeWorkspaceCookie(next);
    set(next);
  };

  return {
    ...readWorkspaceCookie(),
    setActiveTopic: (id) => save({ activeTopicId: id }),
    toggleSoundMuted: () => save({ soundMuted: !get().soundMuted }),
  };
};

export default createWorkspaceSlice;
