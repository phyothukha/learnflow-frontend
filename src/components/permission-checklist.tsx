"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  function setCodes(codes: PermissionCode[], checked: boolean) {
    const next = new Set(selected);
    codes.forEach((code) => (checked ? next.add(code) : next.delete(code)));
    onChange(next);
  }

  function toggle(
    group: PermissionGroup,
    code: PermissionCode,
    checked: boolean,
  ) {
    const viewCode = group.items.find(
      (item) => item.label.startsWith("View") || item.label === "Access",
    )?.code;
    if (checked) {
      setCodes(viewCode ? [code, viewCode] : [code], true);
    } else if (code === viewCode) {
      setCodes(
        group.items.map((item) => item.code),
        false,
      );
    } else {
      setCodes([code], false);
    }
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const codes = group.items.map((item) => item.code);
        const count = codes.filter((code) => selected.has(code)).length;
        const allChecked = count === codes.length;
        return (
          <section key={group.key} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-medium">{group.label}</h3>
                <p className="text-xs text-muted-foreground">
                  {group.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {count}/{codes.length}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  disabled={readOnly}
                  onClick={() => setCodes(codes, !allChecked)}
                >
                  {allChecked ? "Clear" : "Select all"}
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {group.items.map((item) => {
                const id = `${idPrefix}-${item.code}`;
                return (
                  <div key={item.code} className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={selected.has(item.code)}
                      disabled={readOnly}
                      onCheckedChange={(checked) =>
                        toggle(group, item.code, checked === true)
                      }
                    />
                    <Label htmlFor={id} className="text-sm font-normal">
                      {item.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function PermissionSummary({
  permissions,
  groups = PERMISSION_GROUPS,
  emptyLabel = "This role has no permissions.",
}: {
  permissions: PermissionCode[];
  groups?: PermissionGroup[];
  emptyLabel?: string;
}) {
  const granted = new Set(permissions);
  const rows = groups
    .map((group) => ({
      group,
      labels: group.items
        .filter((item) => granted.has(item.code))
        .map((item) => item.label),
    }))
    .filter((row) => row.labels.length > 0);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <dl className="space-y-1.5 text-sm">
      {rows.map(({ group, labels }) => (
        <div key={group.key} className="flex gap-2">
          <dt className="w-32 shrink-0 font-medium">{group.label}</dt>
          <dd className="min-w-0 text-muted-foreground">{labels.join(", ")}</dd>
        </div>
      ))}
    </dl>
  );
}
