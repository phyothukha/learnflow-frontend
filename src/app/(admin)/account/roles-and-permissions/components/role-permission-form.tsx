"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ALL_PERMISSION_CODES,
  PERMISSION_GROUPS,
} from "@/lib/permission-groups";
import type { PermissionCode } from "@/lib/permissions";
import { PermissionMatrixRow } from "@/components/permission-matrix-row";
import { Button } from "@/components/ui/button";

const schema = z.object({
  Name: z
    .string()
    .trim()
    .min(1, "Role name is required")
    .refine(
      (value) => value.replace(/\s+/g, "-").toLowerCase() !== "new-role",
      "Role name cannot be a reserved name",
    )
    .refine(
      (value) => !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(value),
      "Role name cannot contain special characters",
    ),
  Description: z.string().trim(),
});

export type RolePermissionFormValues = z.infer<typeof schema>;

interface RolePermissionFormProps {
  mode: "create" | "edit";
  initialName?: string;
  initialDescription?: string;
  initialPermissions?: PermissionCode[];
  readOnly?: boolean;
  submitting?: boolean;
  onSubmit: (
    values: RolePermissionFormValues & { Permissions: PermissionCode[] },
  ) => void;
}

export function RolePermissionForm({
  mode,
  initialName = "",
  initialDescription = "",
  initialPermissions = [],
  readOnly = false,
  submitting = false,
  onSubmit,
}: RolePermissionFormProps) {
  const form = useForm<RolePermissionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      Name: initialName,
      Description: initialDescription,
    },
  });

  const [selected, setSelected] = useState(() => new Set(initialPermissions));

  useEffect(() => {
    form.reset({
      Name: initialName,
      Description: initialDescription,
    });
    setSelected(new Set(initialPermissions));
  }, [initialName, initialDescription, initialPermissions, form]);

  const fullAccess = useMemo(
    () => ALL_PERMISSION_CODES.every((code) => selected.has(code)),
    [selected],
  );

  const groups = PERMISSION_GROUPS.filter((group) => group.items.length > 0);
  const selectedCount = selected.size;
  const totalCount = ALL_PERMISSION_CODES.length;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({ ...values, Permissions: [...selected] }),
        )}
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <div className="shrink-0 space-y-4 border-b p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Role details</p>
              <p className="text-xs text-muted-foreground">
                {selectedCount}/{totalCount} permissions selected
              </p>
            </div>
            <div className="flex h-9 items-center gap-2 rounded-lg border bg-muted/30 px-2.5">
              <Switch
                id="full-access"
                checked={fullAccess}
                disabled={readOnly}
                onCheckedChange={(checked) => {
                  setSelected(
                    checked
                      ? new Set(ALL_PERMISSION_CODES)
                      : new Set<PermissionCode>(),
                  );
                }}
              />
              <Label htmlFor="full-access" className="text-sm font-medium">
                Full Access
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <FormField
              control={form.control}
              name="Name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Please enter role name"
                      disabled={readOnly}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Description"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Role Description (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Please enter description"
                      disabled={readOnly}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          <div>
            <p className="text-sm font-medium">Permissions</p>
            <p className="text-xs text-muted-foreground">
              Check an action to grant or revoke it. Use Toggle All for a whole
              module.
            </p>
          </div>
          {groups.map((group) => (
            <PermissionMatrixRow
              key={group.key}
              group={group}
              selected={selected}
              onChange={setSelected}
              readOnly={readOnly}
              idPrefix={`${mode}-${group.key}`}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t p-4 sm:px-5">
          <Button type="submit" disabled={readOnly || submitting}>
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
