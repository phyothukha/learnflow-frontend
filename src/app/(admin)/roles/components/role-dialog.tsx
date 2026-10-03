"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useRolesStore, type Role } from "@/store/client/mock/roles-store";

const NONE = "none";

const schema = z.object({
  Name: z.string().trim().min(1, "Role name is required"),
  Description: z.string().trim(),
  CopyFrom: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface RoleDialogProps {
  open: boolean;
  /** Pass a role to rename it; omit to create a new one. */
  role?: Role | null;
  onClose: () => void;
  onCreated?: (role: Role) => void;
}

export function RoleDialog({
  open,
  role,
  onClose,
  onCreated,
}: RoleDialogProps) {
  const roles = useRolesStore((state) => state.roles);
  const createRole = useRolesStore((state) => state.createRole);
  const updateRole = useRolesStore((state) => state.updateRole);
  const isEdit = !!role;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { Name: "", Description: "", CopyFrom: NONE },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      Name: role?.Name ?? "",
      Description: role?.Description ?? "",
      CopyFrom: NONE,
    });
  }, [open, role, form]);

  function onSubmit(values: FormValues) {
    const taken = roles.some(
      (item) =>
        item.Name.toLowerCase() === values.Name.toLowerCase() &&
        item.Id !== role?.Id,
    );
    if (taken) {
      form.setError("Name", {
        message: "A role with this name already exists",
      });
      return;
    }

    if (role) {
      updateRole(role.Id, {
        Name: values.Name,
        Description: values.Description,
      });
      toast.success("Role updated.");
    } else {
      const created = createRole({
        Name: values.Name,
        Description: values.Description,
        CopyFromRoleId: values.CopyFrom === NONE ? undefined : values.CopyFrom,
      });
      toast.success("Role created.");
      onCreated?.(created);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Change how this role is named and described."
              : "Create a role, then tick the permissions it should have."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Content Reviewer"
                      disabled={role?.IsSystem}
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
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="What is this role for?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEdit && (
              <FormField
                control={form.control}
                name="CopyFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start from</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>No permissions</SelectItem>
                        {roles.map((item) => (
                          <SelectItem key={item.Id} value={item.Id}>
                            Copy of {item.Name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEdit ? "Save" : "Create role"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
