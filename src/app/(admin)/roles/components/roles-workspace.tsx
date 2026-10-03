"use client";

import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useLearnersStore } from "@/store/client/mock/learners-store";
import {
  SUPER_ADMIN_ROLE_ID,
  useRolesStore,
} from "@/store/client/mock/roles-store";
import { RoleDialog } from "./role-dialog";
import { RoleEditor } from "./role-editor";

type DialogState = "create" | "edit" | null;

export function RolesWorkspace() {
  const roles = useRolesStore((state) => state.roles);
  const learners = useLearnersStore((state) => state.learners);
  const { hasPermission } = usePermission();
  const [selectedId, setSelectedId] = useState(SUPER_ADMIN_ROLE_ID);
  const [dialog, setDialog] = useState<DialogState>(null);

  const selected = roles.find((role) => role.Id === selectedId) ?? roles[0];
  const canCreate = hasPermission(PERMISSIONS.ROLES_CREATE);

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Roles ({roles.length})</h2>
          {canCreate && (
            <Button size="sm" onClick={() => setDialog("create")}>
              <Plus />
              New role
            </Button>
          )}
        </div>
        <ul className="flex min-h-0 gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
          {roles.map((role) => {
            const members = learners.filter(
              (item) => item.RoleId === role.Id,
            ).length;
            const active = role.Id === selected?.Id;
            return (
              <li key={role.Id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setSelectedId(role.Id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "w-60 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-full",
                    active
                      ? "border-primary bg-primary/5"
                      : "bg-card hover:bg-accent",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{role.Name}</span>
                    </span>
                    {role.IsSystem && <Badge variant="outline">System</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {role.Description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                    {members} {members === 1 ? "user" : "users"} ·{" "}
                    {role.Permissions.length} permissions
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selected && (
        <RoleEditor
          key={selected.Id + selected.Permissions.join(",")}
          role={selected}
          onEdit={() => setDialog("edit")}
          onDeleted={() => setSelectedId(SUPER_ADMIN_ROLE_ID)}
        />
      )}

      <RoleDialog
        open={dialog !== null}
        role={dialog === "edit" ? selected : null}
        onClose={() => setDialog(null)}
        onCreated={(role) => setSelectedId(role.Id)}
      />
    </div>
  );
}
