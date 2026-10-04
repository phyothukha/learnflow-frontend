"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/utils/string";
import { Button } from "@/components/ui/button";

const profileSchema = z.object({
  Name: z.string().trim().min(1, "Name is required"),
  Email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AccountProfilePage() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { Name: name, Email: email },
  });

  useEffect(() => {
    form.reset({ Name: name, Email: email });
  }, [name, email, form]);

  const displayName = form.watch("Name") || name || "?";

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your account details for this admin workspace"
      />

      <div className="mx-auto w-full max-w-lg space-y-4">
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
          <Avatar className="size-14">
            <AvatarFallback className="text-base">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {email || "—"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(() => {
              toast.success("Profile saved.");
            })}
            className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
          >
            <FormField
              control={form.control}
              name="Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
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
                    <Input type="email" disabled {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-1">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
