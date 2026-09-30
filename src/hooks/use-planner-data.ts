import { useShallow } from "zustand/react/shallow";
import { usePlannerStore } from "@/store/client/planner-store";
import type { PlannerData } from "@/store/client/planner-seed";

/** Every planner collection, e.g. to build a `SchedulingContext`. */
export function usePlannerData(): PlannerData {
  return usePlannerStore(
    useShallow((state) => ({
      goals: state.goals,
      milestones: state.milestones,
      tasks: state.tasks,
      availability: state.availability,
      settings: state.settings,
      entries: state.entries,
      sessions: state.sessions,
      reviews: state.reviews,
    })),
  );
}
