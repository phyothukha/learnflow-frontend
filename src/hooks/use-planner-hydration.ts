import { useEffect, useSyncExternalStore } from "react";
import { usePlannerStore } from "@/store/client/planner-store";

// Undefined on the server, where zustand has no storage to persist to.
const persist = usePlannerStore.persist as
  typeof usePlannerStore.persist | undefined;

function subscribe(onChange: () => void) {
  return persist?.onFinishHydration(onChange) ?? (() => {});
}

function hasHydrated() {
  return persist?.hasHydrated() ?? false;
}

/** Planner data lives in localStorage, so render it only after rehydrating. */
export function usePlannerHydration() {
  const hydrated = useSyncExternalStore(subscribe, hasHydrated, () => false);

  useEffect(() => {
    if (!persist || persist.hasHydrated()) return;
    void Promise.resolve(persist.rehydrate()).then(() =>
      usePlannerStore.getState().markMissedEntries(),
    );
  }, []);

  return hydrated;
}
