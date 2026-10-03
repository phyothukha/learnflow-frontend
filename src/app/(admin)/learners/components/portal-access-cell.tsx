"use client";

import { Badge } from "@/components/ui/badge";
import {
  getEffectiveLearnerPermissions,
  getLearnerPortalTabs,
  LEARNER_PORTAL_TABS,
} from "@/lib/learner-access";
import type { Learner } from "@/store/client/mock/learners-store";
import { useRolesStore } from "@/store/client/mock/roles-store";

export function PortalAccessCell({ learner }: { learner: Learner }) {
  const roles = useRolesStore((state) => state.roles);
  const permissions = getEffectiveLearnerPermissions(learner, roles);
  const tabs = getLearnerPortalTabs(permissions);

  if (tabs.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {LEARNER_PORTAL_TABS.filter((tab) => tabs.includes(tab.key)).map(
        (tab) => (
          <Badge key={tab.key} variant="outline" className="font-normal">
            {tab.label}
          </Badge>
        ),
      )}
      {learner.CustomPermissions ? (
        <Badge variant="secondary" className="font-normal">
          Custom
        </Badge>
      ) : null}
    </div>
  );
}
