"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useNotesStore } from "@/store/client/notes-store";
import { useTeamsStore } from "@/store/client/teams-store";

function subscribeNotes(onStoreChange: () => void) {
  const persist = useNotesStore.persist;
  if (!persist) return () => {};
  return persist.onFinishHydration(onStoreChange);
}

function subscribeTeams(onStoreChange: () => void) {
  const persist = useTeamsStore.persist;
  if (!persist) return () => {};
  return persist.onFinishHydration(onStoreChange);
}

function notesHydrated() {
  return useNotesStore.persist?.hasHydrated() ?? true;
}

function teamsHydrated() {
  return useTeamsStore.persist?.hasHydrated() ?? true;
}

/** Rehydrates teams + workspace notes from localStorage (SSR-safe). */
export function useWorkspaceNotesHydration() {
  const notesReady = useSyncExternalStore(
    subscribeNotes,
    notesHydrated,
    () => false,
  );
  const teamsReady = useSyncExternalStore(
    subscribeTeams,
    teamsHydrated,
    () => false,
  );

  useEffect(() => {
    void useNotesStore.persist?.rehydrate();
    void useTeamsStore.persist?.rehydrate();
  }, []);

  return notesReady && teamsReady;
}
