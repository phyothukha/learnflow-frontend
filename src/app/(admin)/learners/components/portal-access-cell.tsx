"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getEffectiveLearnerPermissions,
  getLearnerPortalTabs,
  LEARNER_PORTAL_TABS,
} from "@/lib/learner-access";
import type { Learner } from "@/store/client/mock/learners-store";
import { useRolesStore } from "@/store/client/mock/roles-store";

const VISIBLE = 2;

export function PortalAccessCell({ learner }: { learner: Learner }) {
  const roles = useRolesStore((state) => state.roles);
  const permissions = getEffectiveLearnerPermissions(learner, roles);
  const granted = new Set(getLearnerPortalTabs(permissions));
  const tabs = LEARNER_PORTAL_TABS.filter((tab) => granted.has(tab.key));

  if (tabs.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = tabs.slice(0, VISIBLE);
  const rest = tabs.slice(VISIBLE);

  return (
    <TooltipProvider>
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {visible.map((tab) => (
          <Badge key={tab.key} variant="outline" className="font-normal">
            {tab.label}
          </Badge>
        ))}
        {rest.length > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-6 items-center rounded-full border bg-muted/50 px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted"
              >
                +{rest.length}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <ul className="space-y-1">
                {rest.map((tab) => (
                  <li key={tab.key} className="text-xs">
                    {tab.label}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
