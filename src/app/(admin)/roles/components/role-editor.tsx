"use client";

import { useState } from "react";
import { Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PermissionChecklist } from "@/components/permission-checklist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";
import { useLearnersStore } from "@/store/client/mock/learners-store";
import { useRolesStore, type Role } from "@/store/client/mock/roles-store";

interface RoleEditorProps {
  role: Role;
  onEdit: () => void;
  onDeleted: () => void;
}

function sameSet(a: Set<PermissionCode>, b: PermissionCode[]) {
  return a.size === b.length && b.every((code) => a.has(code));
}

export function RoleEditor({ role, onEdit, onDeleted }: RoleEditorProps) {
  const { hasPermission } = usePermission();
  const updateRole = useRolesStore((state) => state.updateRole);
  const deleteRole = useRolesStore((state) => state.deleteRole);
  const memberCount = useLearnersStore(
    (state) => state.learners.filter((item) => item.RoleId === role.Id).length,
  );
  const { confirmDelete, dialogProps } = useConfirmDialog();

  const [draft, setDraft] = useState(() => new Set(role.Permissions));

  const canUpdate = hasPermission(PERMISSIONS.ROLES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ROLES_DELETE);
  const readOnly = role.IsLocked || !canUpdate;
  const dirty = !sameSet(draft, role.Permissions);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold">{role.Name}</h2>
            {role.IsSystem && <Badge variant="outline">System</Badge>}
            {role.IsLocked && (
              <Badge variant="status-slate">
                <Lock className="size-3" />
                Locked
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{role.Description}</p>
          <p className="text-xs text-muted-foreground">
            {memberCount} {memberCount === 1 ? "user" : "users"} with this role
            {" · "}
            {draft.size} permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && !role.IsLocked && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil />
              Edit
            </Button>
          )}
          {canDelete && !role.IsSystem && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={() => {
                if (memberCount > 0) {
                  toast.error(
                    "Move the users on this role to another role before deleting it.",
                  );
                  return;
                }
                confirmDelete({
                  title: "Delete role?",
                  description: `"${role.Name}" will be removed. This action cannot be undone.`,
                  successMessage: "Role deleted.",
                  onConfirm: () => {
                    deleteRole(role.Id);
                    onDeleted();
                  },
                });
              }}
            >
              <Trash2 />
              Delete
            </Button>
          )}
        </div>
      </div>

      {role.IsLocked && (
        <p className="border-b bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          Super Admin always has every permission and cannot be changed.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <PermissionChecklist
          selected={draft}
          onChange={setDraft}
          readOnly={readOnly}
          idPrefix={role.Id}
        />
      </div>

      {!readOnly && (
        <div className="flex items-center justify-between gap-3 border-t p-3">
          <p className="text-sm text-muted-foreground">
            {dirty ? "You have unsaved changes." : "All changes saved."}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={!dirty}
              onClick={() => setDraft(new Set(role.Permissions))}
            >
              Reset
            </Button>
            <Button
              disabled={!dirty}
              onClick={() => {
                updateRole(role.Id, { Permissions: [...draft] });
                toast.success("Permissions saved.");
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
