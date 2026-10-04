"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
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

const editSchema = z.object({
  Name: z.string().trim().min(1, "Name is required"),
  Email: z.string().trim().email("Email is required"),
  RoleId: z.string().min(1, "Select a role for this user"),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditUserPageProps {
  params: Promise<{ userId: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { userId } = use(params);
  const router = useRouter();
  const users = useAdminUsersStore((state) => state.users);
  const updateUser = useAdminUsersStore((state) => state.updateUser);
  const user = users.find((item) => item.Id === userId);
  const roles = useRolesStore((state) => state.roles);
  const staffRoles = useMemo(
    () => roles.filter((role) => role.Id !== LEARNER_ROLE_ID),
    [roles],
  );
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      Name: user?.Name ?? "",
      Email: user?.Email ?? "",
      RoleId: user?.RoleId ?? "",
    },
  });

  useEffect(() => {
    if (!user) {
      router.replace("/account/user-management");
      return;
    }
    form.reset({
      Name: user.Name,
      Email: user.Email,
      RoleId: user.RoleId,
    });
  }, [user, form, router]);

  if (!user) return null;

  function onSubmit(values: EditFormValues) {
    if (values.RoleId === LEARNER_ROLE_ID) {
      form.setError("RoleId", {
        message: "Choose an admin role — learners are managed under Learners.",
      });
      return;
    }

    const duplicate = users.some(
      (item) =>
        item.Email.toLowerCase() === values.Email.toLowerCase() &&
        item.Id !== userId,
    );
    if (duplicate) {
      form.setError("Email", { message: "This email is already in use" });
      return;
    }

    setSubmitting(true);
    updateUser(userId, {
      Name: values.Name,
      Email: values.Email,
      RoleId: values.RoleId,
    });
    toast.success("User updated.");
    setSubmitting(false);
    router.push("/account/user-management");
  }

  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
          <CardDescription>
            Update this admin or staff account details
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
                name="Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Please enter name"
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
                name="Email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Please enter email"
                        autoComplete="email"
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
                <Save />
                Save changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
