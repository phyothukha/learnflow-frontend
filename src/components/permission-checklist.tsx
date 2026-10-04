"use client";

import { PermissionMatrixRow } from "@/components/permission-matrix-row";
import {
  PERMISSION_GROUPS,
  type PermissionGroup,
} from "@/lib/permission-groups";
import type { PermissionCode } from "@/lib/permissions";

interface PermissionChecklistProps {
  selected: Set<PermissionCode>;
  onChange: (next: Set<PermissionCode>) => void;
  readOnly?: boolean;
  idPrefix: string;
  groups?: PermissionGroup[];
}

export function PermissionChecklist({
  selected,
  onChange,
  readOnly = false,
  idPrefix,
  groups = PERMISSION_GROUPS,
}: PermissionChecklistProps) {
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <PermissionMatrixRow
          key={group.key}
          group={group}
          selected={selected}
          onChange={onChange}
          readOnly={readOnly}
          idPrefix={idPrefix}
        />
      ))}
    </div>
  );
}

export function PermissionSummary({
  permissions,
  groups = PERMISSION_GROUPS,
  emptyLabel = "This role has no permissions.",
  idPrefix = "permission-summary",
}: {
  permissions: PermissionCode[];
  groups?: PermissionGroup[];
  emptyLabel?: string;
  idPrefix?: string;
}) {
  const selected = new Set(permissions);
  const hasAny = groups.some((group) =>
    group.items.some((item) => selected.has(item.code)),
  );

  if (!hasAny) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <PermissionChecklist
      selected={selected}
      onChange={() => {}}
      readOnly
      idPrefix={idPrefix}
      groups={groups}
    />
  );
}
