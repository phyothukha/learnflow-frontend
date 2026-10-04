"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { PermissionGroup } from "@/lib/permission-groups";
import type { PermissionCode } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface PermissionMatrixRowProps {
  group: PermissionGroup;
  selected: Set<PermissionCode>;
  onChange: (next: Set<PermissionCode>) => void;
  readOnly?: boolean;
  idPrefix: string;
}

export function PermissionMatrixRow({
  group,
  selected,
  onChange,
  readOnly = false,
  idPrefix,
}: PermissionMatrixRowProps) {
  const codes = group.items.map((item) => item.code);
  const selectedCount = codes.filter((code) => selected.has(code)).length;
  const allChecked = selectedCount === codes.length && codes.length > 0;
  const someChecked = selectedCount > 0 && !allChecked;

  function setCodes(nextCodes: PermissionCode[], checked: boolean) {
    const next = new Set(selected);
    nextCodes.forEach((code) => (checked ? next.add(code) : next.delete(code)));
    onChange(next);
  }

  function toggleOne(code: PermissionCode, checked: boolean) {
    const viewCode = group.items.find(
      (item) => item.label.startsWith("View") || item.label === "Access",
    )?.code;
    if (checked) {
      setCodes(viewCode ? [code, viewCode] : [code], true);
    } else if (code === viewCode) {
      setCodes(codes, false);
    } else {
      setCodes([code], false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-muted/20 p-3 transition-colors sm:p-4",
        (allChecked || someChecked) && "border-primary/25 bg-primary/[0.03]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-md border bg-background px-2.5 py-1 text-sm font-semibold capitalize shadow-xs">
              {group.label}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {selectedCount}/{codes.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {group.description}
          </p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Switch
              checked={allChecked}
              onCheckedChange={(checked) => setCodes(codes, checked)}
              id={`${idPrefix}-${group.key}-all`}
            />
            <Label
              htmlFor={`${idPrefix}-${group.key}-all`}
              className="text-sm font-medium"
            >
              Toggle All
            </Label>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {group.items.map((item) => {
          const id = `${idPrefix}-${item.code}`;
          const checked = selected.has(item.code);
          return (
            <Label
              key={item.code}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-center gap-2 text-sm font-normal",
                checked ? "text-foreground" : "text-muted-foreground",
                readOnly && "pointer-events-none opacity-60",
              )}
            >
              <Checkbox
                id={id}
                checked={checked}
                disabled={readOnly}
                onCheckedChange={(value) =>
                  toggleOne(item.code, value === true)
                }
              />
              <span className="min-w-0 leading-snug">{item.label}</span>
            </Label>
          );
        })}
      </div>
    </div>
  );
}
