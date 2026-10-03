"use client";

import {
  PermissionChecklist,
  PermissionSummary,
} from "@/components/permission-checklist";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LEARNER_PORTAL_PERMISSION_GROUPS } from "@/lib/permission-groups";
import type { PermissionCode } from "@/lib/permissions";

const PORTAL_CODES = new Set(
  LEARNER_PORTAL_PERMISSION_GROUPS.flatMap((group) =>
    group.items.map((item) => item.code),
  ),
);

export function portalCodesFrom(permissions: PermissionCode[] = []) {
  return permissions.filter((code) => PORTAL_CODES.has(code));
}

/** Keep non-portal role codes; replace portal tab access with the selection. */
export function mergePortalCustom(
  rolePermissions: PermissionCode[],
  portalCustom: PermissionCode[],
): PermissionCode[] {
  return [
    ...rolePermissions.filter((code) => !PORTAL_CODES.has(code)),
    ...portalCustom,
  ];
}

interface PortalAccessFieldsProps {
  customize: boolean;
  onCustomizeChange: (enabled: boolean) => void;
  custom: Set<PermissionCode>;
  onCustomChange: (next: Set<PermissionCode>) => void;
  roleName?: string;
  rolePermissions: PermissionCode[];
  idPrefix: string;
}

export function PortalAccessFields({
  customize,
  onCustomizeChange,
  custom,
  onCustomChange,
  roleName,
  rolePermissions,
  idPrefix,
}: PortalAccessFieldsProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Portal access</p>
          <p className="text-xs text-muted-foreground">
            {customize
              ? "Pick Dashboard, Tasks, Notes, and Teams for this learner only."
              : `Uses the ${roleName ?? "role"} defaults until you customize.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            id={`${idPrefix}-customize`}
            checked={customize}
            onCheckedChange={onCustomizeChange}
          />
          <Label
            htmlFor={`${idPrefix}-customize`}
            className="text-sm font-normal"
          >
            Customize
          </Label>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {customize ? (
          <PermissionChecklist
            selected={custom}
            onChange={onCustomChange}
            idPrefix={idPrefix}
            groups={LEARNER_PORTAL_PERMISSION_GROUPS}
          />
        ) : (
          <PermissionSummary
            permissions={portalCodesFrom(rolePermissions)}
            groups={LEARNER_PORTAL_PERMISSION_GROUPS}
            emptyLabel="This role grants no learner-portal tabs."
          />
        )}
      </div>
    </div>
  );
}
