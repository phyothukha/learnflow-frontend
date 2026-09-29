import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import createPrimaryColorSlice, {
  type PrimaryColorSlice,
} from "./primary-color-slice";
import createWorkspaceSlice, { type WorkspaceSlice } from "./workspace-slice";

export type AppState = WorkspaceSlice & PrimaryColorSlice;

/**
 * Global client store. Each slice persists itself to cookies.
 * @example const activeTopicId = useStore((state) => state.activeTopicId)
 */
export const useStore = create<AppState>()((...a) => ({
  ...createWorkspaceSlice(...a),
  ...createPrimaryColorSlice(...a),
}));

/**
 * Workspace store hook (facade).
 * @example const { activeTopicId, setActiveTopic } = useWorkspaceStore()
 */
export function useWorkspaceStore() {
  return useStore(
    useShallow((state) => ({
      activeTopicId: state.activeTopicId,
      soundMuted: state.soundMuted,
      setActiveTopic: state.setActiveTopic,
      toggleSoundMuted: state.toggleSoundMuted,
    })),
  );
}

/**
 * Primary color store hook (facade).
 * @example const { primaryColor, setPrimaryColor } = usePrimaryColorStore()
 */
export function usePrimaryColorStore() {
  return useStore(
    useShallow((state) => ({
      primaryColor: state.primaryColor,
      setPrimaryColor: state.setPrimaryColor,
    })),
  );
}

export default useStore;
