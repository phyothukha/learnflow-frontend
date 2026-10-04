"use client";

import { useMemo } from "react";
import { PermissionChecklist } from "@/components/permission-checklist";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LEARNER_PORTAL_PERMISSION_GROUPS } from "@/lib/permission-groups";
import type { PermissionCode } from "@/lib/permissions";

const PORTAL_CODES = LEARNER_PORTAL_PERMISSION_GROUPS.flatMap((group) =>
  group.items.map((item) => item.code),
);

const PORTAL_CODE_SET = new Set(PORTAL_CODES);

export function portalCodesFrom(permissions: PermissionCode[] = []) {
  return permissions.filter((code) => PORTAL_CODE_SET.has(code));
}

/** Keep non-portal role codes; replace portal tab access with the selection. */
export function mergePortalCustom(
  rolePermissions: PermissionCode[],
  portalCustom: PermissionCode[],
): PermissionCode[] {
  return [
    ...rolePermissions.filter((code) => !PORTAL_CODE_SET.has(code)),
    ...portalCustom,
  ];
}

export function portalSelectionMatchesRole(
  selected: Set<PermissionCode>,
  rolePermissions: PermissionCode[],
) {
  const rolePortal = portalCodesFrom(rolePermissions);
  if (selected.size !== rolePortal.length) return false;
  return rolePortal.every((code) => selected.has(code));
}

export function portalAccessLabel(
  permissions: PermissionCode[],
  options?: { isCustom?: boolean; roleName?: string },
) {
  const selected = portalCodesFrom(permissions);
  if (selected.length === 0) return "Without Access";
  if (
    PORTAL_CODES.length > 0 &&
    PORTAL_CODES.every((code) => selected.includes(code))
  ) {
    return "Access All";
  }
  if (options?.isCustom) return "Custom";
  return options?.roleName ? `From ${options.roleName}` : "Partial";
}

interface PortalAccessAllSwitchProps {
  selected: Set<PermissionCode>;
  onChange: (next: Set<PermissionCode>) => void;
  idPrefix: string;
  readOnly?: boolean;
}

export function PortalAccessAllSwitch({
  selected,
  onChange,
  idPrefix,
  readOnly = false,
}: PortalAccessAllSwitchProps) {
  const accessAll = useMemo(
    () =>
      PORTAL_CODES.length > 0 &&
      PORTAL_CODES.every((code) => selected.has(code)),
    [selected],
  );

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-muted/30 px-2.5">
      <Switch
        id={`${idPrefix}-access-all`}
        checked={accessAll}
        disabled={readOnly}
        onCheckedChange={(checked) => {
          onChange(checked ? new Set(PORTAL_CODES) : new Set());
        }}
      />
      <Label htmlFor={`${idPrefix}-access-all`} className="text-sm font-medium">
        Access All
      </Label>
    </div>
  );
}

interface PortalAccessFieldsProps {
  selected: Set<PermissionCode>;
  onChange: (next: Set<PermissionCode>) => void;
  idPrefix: string;
  readOnly?: boolean;
  showHeader?: boolean;
}

export function PortalAccessFields({
  selected,
  onChange,
  idPrefix,
  readOnly = false,
  showHeader = true,
}: PortalAccessFieldsProps) {
  return (
    <div className="space-y-3">
      {showHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Portal access</p>
            <p className="text-xs text-muted-foreground">
              Use Access All for every portal tab, or leave it off for without
              access — then fine-tune with the checkboxes.
            </p>
          </div>
          <PortalAccessAllSwitch
            selected={selected}
            onChange={onChange}
            idPrefix={idPrefix}
            readOnly={readOnly}
          />
        </div>
      ) : null}
      <PermissionChecklist
        selected={selected}
        onChange={onChange}
        readOnly={readOnly}
        idPrefix={idPrefix}
        groups={LEARNER_PORTAL_PERMISSION_GROUPS}
      />
    </div>
  );
}
