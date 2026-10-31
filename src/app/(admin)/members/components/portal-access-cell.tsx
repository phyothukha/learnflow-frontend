"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getEffectiveMemberPermissions,
  getMemberPortalTabs,
  MEMBER_PORTAL_TABS,
} from "@/lib/member-access";
import type { Member } from "@/store/client/mock/members-store";
import { useRolesStore } from "@/store/client/mock/roles-store";

const VISIBLE = 2;

export function PortalAccessCell({ member }: { member: Member }) {
  const roles = useRolesStore((state) => state.roles);
  const permissions = getEffectiveMemberPermissions(member, roles);
  const granted = new Set(getMemberPortalTabs(permissions));
  const tabs = MEMBER_PORTAL_TABS.filter((tab) => granted.has(tab.key));

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
