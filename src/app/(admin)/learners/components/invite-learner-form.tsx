"use client";

import { useState } from "react";
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
import type { PermissionCode } from "@/lib/permissions";
import { useLearnersStore } from "@/store/client/mock/learners-store";
import {
  LEARNER_ROLE_ID,
  useRolesStore,
} from "@/store/client/mock/roles-store";
import {
  mergePortalCustom,
  PortalAccessFields,
  portalCodesFrom,
} from "./portal-access-fields";

const inviteSchema = z.object({
  Email: z.string().trim().email("Enter a valid email"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export function InviteLearnerForm() {
  const router = useRouter();
  const learners = useLearnersStore((state) => state.learners);
  const inviteLearner = useLearnersStore((state) => state.inviteLearner);
  const learnerRole = useRolesStore((state) =>
    state.roles.find((role) => role.Id === LEARNER_ROLE_ID),
  );
  const rolePermissions = learnerRole?.Permissions ?? [];

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { Email: "" },
  });

  const [customize, setCustomize] = useState(false);
  const [custom, setCustom] = useState<Set<PermissionCode>>(new Set());

  function onCustomizeChange(enabled: boolean) {
    setCustomize(enabled);
    if (enabled) {
      setCustom(new Set(portalCodesFrom(rolePermissions)));
    }
  }

  function onSubmit(values: InviteFormValues) {
    const duplicate = learners.some(
      (learner) => learner.Email.toLowerCase() === values.Email.toLowerCase(),
    );
    if (duplicate) {
      form.setError("Email", { message: "This email is already in use" });
      return;
    }

    const created = inviteLearner({
      Email: values.Email,
      RoleId: LEARNER_ROLE_ID,
      CustomPermissions: customize
        ? mergePortalCustom(rolePermissions, [...custom])
        : null,
    });
    toast.success(`Invitation sent to ${values.Email}.`);
    router.push(`/learners/${created.Id}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-5"
      >
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
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <PortalAccessFields
          customize={customize}
          onCustomizeChange={onCustomizeChange}
          custom={custom}
          onCustomChange={setCustom}
          roleName={learnerRole?.Name ?? "Learner"}
          rolePermissions={rolePermissions}
          idPrefix="invite-learner"
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/learners")}
          >
            Cancel
          </Button>
          <Button type="submit">Send invite</Button>
        </div>
      </form>
    </Form>
  );
}
