"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Send } from "lucide-react";
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
  PortalAccessAllSwitch,
  PortalAccessFields,
  portalCodesFrom,
  portalSelectionMatchesRole,
} from "./portal-access-fields";

const inviteSchema = z.object({
  Email: z.string().trim().email("Email is required"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const EMPTY_PERMISSIONS: PermissionCode[] = [];

export function InviteLearnerForm() {
  const learners = useLearnersStore((state) => state.learners);
  const inviteLearner = useLearnersStore((state) => state.inviteLearner);
  const learnerRole = useRolesStore((state) =>
    state.roles.find((role) => role.Id === LEARNER_ROLE_ID),
  );
  const rolePermissions = learnerRole?.Permissions ?? EMPTY_PERMISSIONS;

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { Email: "" },
  });

  const [selected, setSelected] = useState(
    () => new Set(portalCodesFrom(rolePermissions)),
  );
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(values: InviteFormValues) {
    const duplicate = learners.some(
      (learner) => learner.Email.toLowerCase() === values.Email.toLowerCase(),
    );
    if (duplicate) {
      form.setError("Email", { message: "This email is already in use" });
      return;
    }

    setSubmitting(true);
    const matchesRole = portalSelectionMatchesRole(selected, rolePermissions);
    inviteLearner({
      Email: values.Email,
      RoleId: LEARNER_ROLE_ID,
      CustomPermissions: matchesRole
        ? null
        : mergePortalCustom(rolePermissions, [...selected]),
    });
    toast.success(`Invitation sent to ${values.Email}.`);
    form.reset({ Email: "" });
    setSelected(new Set(portalCodesFrom(rolePermissions)));
    setSubmitting(false);
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
              <p className="text-sm font-medium">Invite details</p>
              <p className="text-xs text-muted-foreground">
                Send an invite and choose which portal tabs they can open.
              </p>
            </div>
            <PortalAccessAllSwitch
              selected={selected}
              onChange={setSelected}
              idPrefix="invite-learner"
            />
          </div>
          <FormField
            control={form.control}
            name="Email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Please enter email"
                    autoComplete="email"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <PortalAccessFields
            selected={selected}
            onChange={setSelected}
            idPrefix="invite-learner"
            showHeader={false}
          />
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-end sm:px-5">
          <Button type="button" variant="ghost" asChild>
            <Link href="/learners">
              <ArrowLeft />
              Back to learners
            </Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            <Send />
            Send Invitation
          </Button>
        </div>
      </form>
    </Form>
  );
}
