"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useLearnersStore,
  type Learner,
} from "@/store/client/mock/learners-store";
import {
  SUPER_ADMIN_ROLE_ID,
  useRolesStore,
} from "@/store/client/mock/roles-store";
import {
  mergePortalCustom,
  PortalAccessAllSwitch,
  PortalAccessFields,
  portalCodesFrom,
  portalSelectionMatchesRole,
} from "./portal-access-fields";

const editSchema = z.object({
  Name: z.string().trim().min(1, "Name is required"),
  Email: z.string().trim().email("Enter a valid email"),
  RoleId: z.string().min(1, "Role is required"),
});

type EditFormValues = z.infer<typeof editSchema>;

export function EditLearnerForm({ learner }: { learner: Learner }) {
  const router = useRouter();
  const learners = useLearnersStore((state) => state.learners);
  const updateLearner = useLearnersStore((state) => state.updateLearner);
  const allRoles = useRolesStore((state) => state.roles);
  const roles = useMemo(
    () => allRoles.filter((role) => role.Id !== SUPER_ADMIN_ROLE_ID),
    [allRoles],
  );

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      Name: learner.Name,
      Email: learner.Email,
      RoleId: learner.RoleId,
    },
  });

  const [selected, setSelected] = useState(
    () =>
      new Set(
        portalCodesFrom(
          learner.CustomPermissions ??
            allRoles.find((role) => role.Id === learner.RoleId)?.Permissions,
        ),
      ),
  );

  const roleId = form.watch("RoleId");
  const selectedRole = roles.find((role) => role.Id === roleId);

  useEffect(() => {
    form.reset({
      Name: learner.Name,
      Email: learner.Email,
      RoleId: learner.RoleId,
    });
    setSelected(
      new Set(
        portalCodesFrom(
          learner.CustomPermissions ??
            useRolesStore
              .getState()
              .roles.find((role) => role.Id === learner.RoleId)?.Permissions,
        ),
      ),
    );
  }, [learner, form]);

  function onSubmit(values: EditFormValues) {
    const duplicate = learners.some(
      (item) =>
        item.Email.toLowerCase() === values.Email.toLowerCase() &&
        item.Id !== learner.Id,
    );
    if (duplicate) {
      form.setError("Email", { message: "This email is already in use" });
      return;
    }

    const rolePermissions = selectedRole?.Permissions ?? [];
    const matchesRole = portalSelectionMatchesRole(selected, rolePermissions);
    updateLearner(learner.Id, {
      Name: values.Name,
      Email: values.Email,
      RoleId: values.RoleId,
      CustomPermissions: matchesRole
        ? null
        : mergePortalCustom(rolePermissions, [...selected]),
    });
    toast.success("Learner updated.");
    router.push(`/learners/${learner.Id}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <div className="shrink-0 space-y-4 border-b p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Learner details</p>
              <p className="text-xs text-muted-foreground">
                Update profile details and portal tab access.
              </p>
            </div>
            <PortalAccessAllSwitch
              selected={selected}
              onChange={setSelected}
              idPrefix="edit-learner"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <FormField
              control={form.control}
              name="Name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Aye Chan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Email"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="aye.chan@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="RoleId"
              render={({ field }) => (
                <FormItem className="sm:col-span-5">
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.Id} value={role.Id}>
                          {role.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <PortalAccessFields
            selected={selected}
            onChange={setSelected}
            idPrefix="edit-learner"
            showHeader={false}
          />
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t p-4 sm:px-5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/learners/${learner.Id}`)}
          >
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Form>
  );
}
