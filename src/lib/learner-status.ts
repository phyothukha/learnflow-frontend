import type { BadgeVariant } from "@/components/ui/badge";
import { LearnerStatus } from "@/store/client/mock/learners-store";

export const LEARNER_STATUS_VARIANT = new Map<LearnerStatus, BadgeVariant>([
  [LearnerStatus.Active, "status-green"],
  [LearnerStatus.Invited, "status-amber"],
  [LearnerStatus.Disabled, "status-slate"],
]);

export const LEARNER_STATUS_DOT = new Map<LearnerStatus, string>([
  [LearnerStatus.Active, "bg-emerald-500"],
  [LearnerStatus.Invited, "bg-amber-500"],
  [LearnerStatus.Disabled, "bg-slate-400"],
]);
