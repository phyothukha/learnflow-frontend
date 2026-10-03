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
import type { PermissionCode } from "@/lib/permissions";
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
  PortalAccessFields,
  portalCodesFrom,
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

  const [customize, setCustomize] = useState(
    learner.CustomPermissions !== null,
  );
  const [custom, setCustom] = useState<Set<PermissionCode>>(
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
    setCustomize(learner.CustomPermissions !== null);
    setCustom(
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

  function onCustomizeChange(enabled: boolean) {
    setCustomize(enabled);
    if (enabled) {
      setCustom(new Set(portalCodesFrom(selectedRole?.Permissions)));
    }
  }

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
    updateLearner(learner.Id, {
      Name: values.Name,
      Email: values.Email,
      RoleId: values.RoleId,
      CustomPermissions: customize
        ? mergePortalCustom(rolePermissions, [...custom])
        : null,
    });
    toast.success("Learner updated.");
    router.push(`/learners/${learner.Id}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto flex w-full max-w-xl flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="Name"
          render={({ field }) => (
            <FormItem>
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
            <FormItem>
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
            <FormItem>
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
        <PortalAccessFields
          customize={customize}
          onCustomizeChange={onCustomizeChange}
          custom={custom}
          onCustomChange={setCustom}
          roleName={selectedRole?.Name}
          rolePermissions={selectedRole?.Permissions ?? []}
          idPrefix="edit-learner"
        />
        <div className="flex flex-wrap justify-end gap-2">
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
