"use client";

import { useEffect } from "react";
import { writeLearnerAccessCookie } from "@/lib/learner-access";
import { useLearnersStore } from "@/store/client/mock/learners-store";
import { useRolesStore } from "@/store/client/mock/roles-store";

/** Keeps a localhost cookie in sync so the learner app can apply per-learner tab access. */
export function useLearnerAccessSync() {
  const learners = useLearnersStore((state) => state.learners);
  const roles = useRolesStore((state) => state.roles);

  useEffect(() => {
    writeLearnerAccessCookie(learners, roles);
  }, [learners, roles]);
}
