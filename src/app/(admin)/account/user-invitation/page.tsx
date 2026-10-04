"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAdminUsersStore } from "@/store/client/mock/admin-users-store";
import {
  LEARNER_ROLE_ID,
  useRolesStore,
} from "@/store/client/mock/roles-store";

const inviteSchema = z.object({
  Email: z.string().trim().email("Email is required"),
  RoleId: z.string().min(1, "Select a role for this user"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function UserInvitationPage() {
  const users = useAdminUsersStore((state) => state.users);
  const inviteUser = useAdminUsersStore((state) => state.inviteUser);
  const roles = useRolesStore((state) => state.roles);
  const staffRoles = useMemo(
    () => roles.filter((role) => role.Id !== LEARNER_ROLE_ID),
    [roles],
  );
  const defaultRoleId = useMemo(
    () =>
      staffRoles.find((role) => role.Id === "role-admin")?.Id ??
      staffRoles[0]?.Id ??
      "",
    [staffRoles],
  );
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      Email: "",
      RoleId: defaultRoleId,
    },
  });

  function onSubmit(values: InviteFormValues) {
    if (values.RoleId === LEARNER_ROLE_ID) {
      form.setError("RoleId", {
        message: "Choose an admin role — learners are invited from Learners.",
      });
      return;
    }

    const duplicate = users.some(
      (user) => user.Email.toLowerCase() === values.Email.toLowerCase(),
    );
    if (duplicate) {
      form.setError("Email", { message: "This email is already in use" });
      return;
    }

    setSubmitting(true);
    inviteUser({
      Email: values.Email,
      RoleId: values.RoleId,
    });
    toast.success(`Invitation sent to ${values.Email}.`);
    form.reset({ Email: "", RoleId: defaultRoleId });
    setSubmitting(false);
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invite User</CardTitle>
          <CardDescription>
            Invite an admin or staff user — not learners
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <CardContent className="space-y-5">
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
              <FormField
                control={form.control}
                name="RoleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Please select user role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffRoles.map((role) => (
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
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                asChild
              >
                <Link href="/account/user-management">
                  <ArrowLeft />
                  Back to users
                </Link>
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={submitting}
              >
                <Send />
                Send Invitation
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
