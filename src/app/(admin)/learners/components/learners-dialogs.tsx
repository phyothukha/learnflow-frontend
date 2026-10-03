"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  PermissionChecklist,
  PermissionSummary,
} from "@/components/permission-checklist";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LEARNER_PORTAL_PERMISSION_GROUPS } from "@/lib/permission-groups";
import type { PermissionCode } from "@/lib/permissions";
import {
  LearnerStatus,
  MOCK_COURSES,
  useLearnersStore,
} from "@/store/client/mock/learners-store";
import {
  LEARNER_ROLE_ID,
  SUPER_ADMIN_ROLE_ID,
  useRolesStore,
} from "@/store/client/mock/roles-store";
import { LearnersDialogType, useLearners } from "../context/learners-context";

const PORTAL_CODES = new Set(
  LEARNER_PORTAL_PERMISSION_GROUPS.flatMap((group) =>
    group.items.map((item) => item.code),
  ),
);

function portalCodesFrom(permissions: PermissionCode[] = []) {
  return permissions.filter((code) => PORTAL_CODES.has(code));
}

/** Keep non-portal role codes; replace portal tab access with the invite-time selection. */
function mergePortalCustom(
  rolePermissions: PermissionCode[],
  portalCustom: PermissionCode[],
): PermissionCode[] {
  return [
    ...rolePermissions.filter((code) => !PORTAL_CODES.has(code)),
    ...portalCustom,
  ];
}

const inviteSchema = z.object({
  Email: z.string().trim().email("Enter a valid email"),
  RoleId: z.string().min(1, "Role is required"),
});

const editSchema = inviteSchema.extend({
  Name: z.string().trim().min(1, "Name is required"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;
type EditFormValues = z.infer<typeof editSchema>;

function LearnerFormDialog() {
  const { open, currentId, closeDialog } = useLearners();
  const learners = useLearnersStore((state) => state.learners);
  const inviteLearner = useLearnersStore((state) => state.inviteLearner);
  const updateLearner = useLearnersStore((state) => state.updateLearner);
  const allRoles = useRolesStore((state) => state.roles);
  const roles = useMemo(
    () => allRoles.filter((role) => role.Id !== SUPER_ADMIN_ROLE_ID),
    [allRoles],
  );

  const isEdit = open === LearnersDialogType.Edit;

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { Email: "", RoleId: LEARNER_ROLE_ID },
  });
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { Name: "", Email: "", RoleId: LEARNER_ROLE_ID },
  });

  const [customize, setCustomize] = useState(false);
  const [custom, setCustom] = useState<Set<PermissionCode>>(new Set());
  const roleId = isEdit ? editForm.watch("RoleId") : inviteForm.watch("RoleId");
  const selectedRole = roles.find((role) => role.Id === roleId);

  // Reset only when the dialog opens / the target learner changes — not on every render.
  useEffect(() => {
    if (open === LearnersDialogType.Edit && currentId) {
      const learner = useLearnersStore
        .getState()
        .learners.find((item) => item.Id === currentId);
      if (!learner) return;
      const rolePermissions =
        useRolesStore
          .getState()
          .roles.find((role) => role.Id === learner.RoleId)?.Permissions ?? [];
      editForm.reset({
        Name: learner.Name,
        Email: learner.Email,
        RoleId: learner.RoleId,
      });
      setCustomize(learner.CustomPermissions !== null);
      setCustom(
        new Set(portalCodesFrom(learner.CustomPermissions ?? rolePermissions)),
      );
      return;
    }
    if (open === LearnersDialogType.Invite) {
      inviteForm.reset({ Email: "", RoleId: LEARNER_ROLE_ID });
      setCustomize(false);
      setCustom(new Set());
    }
    // inviteForm/editForm methods are stable; including them can re-trigger resets.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open + currentId only
  }, [open, currentId]);

  function onCustomizeChange(enabled: boolean) {
    setCustomize(enabled);
    if (enabled) {
      setCustom(new Set(portalCodesFrom(selectedRole?.Permissions)));
    }
  }

  function saveInvite(values: InviteFormValues) {
    const duplicate = learners.some(
      (learner) => learner.Email.toLowerCase() === values.Email.toLowerCase(),
    );
    if (duplicate) {
      inviteForm.setError("Email", { message: "This email is already in use" });
      return;
    }

    const rolePermissions =
      roles.find((role) => role.Id === values.RoleId)?.Permissions ?? [];
    inviteLearner({
      Email: values.Email,
      RoleId: values.RoleId,
      CustomPermissions: customize
        ? mergePortalCustom(rolePermissions, [...custom])
        : null,
    });
    toast.success(`Invitation sent to ${values.Email}.`);
    closeDialog();
  }

  function saveEdit(values: EditFormValues) {
    if (!currentId) return;
    const duplicate = learners.some(
      (learner) =>
        learner.Email.toLowerCase() === values.Email.toLowerCase() &&
        learner.Id !== currentId,
    );
    if (duplicate) {
      editForm.setError("Email", { message: "This email is already in use" });
      return;
    }

    const rolePermissions =
      roles.find((role) => role.Id === values.RoleId)?.Permissions ?? [];
    updateLearner(currentId, {
      Name: values.Name,
      Email: values.Email,
      RoleId: values.RoleId,
      CustomPermissions: customize
        ? mergePortalCustom(rolePermissions, [...custom])
        : null,
    });
    toast.success("Learner updated.");
    closeDialog();
  }

  const portalAccessBlock = (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Portal access</p>
          <p className="text-xs text-muted-foreground">
            {customize
              ? "Pick Dashboard, Tasks, Notes, and Teams for this learner only."
              : `Uses the ${selectedRole?.Name ?? "role"} defaults until you customize.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            id="customize-permissions"
            checked={customize}
            onCheckedChange={onCustomizeChange}
          />
          <Label
            htmlFor="customize-permissions"
            className="text-sm font-normal"
          >
            Customize
          </Label>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {customize ? (
          <PermissionChecklist
            selected={custom}
            onChange={setCustom}
            idPrefix="learner-form"
            groups={LEARNER_PORTAL_PERMISSION_GROUPS}
          />
        ) : (
          <PermissionSummary
            permissions={portalCodesFrom(selectedRole?.Permissions)}
            groups={LEARNER_PORTAL_PERMISSION_GROUPS}
            emptyLabel="This role grants no learner-portal tabs."
          />
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      open={
        open === LearnersDialogType.Invite || open === LearnersDialogType.Edit
      }
      onOpenChange={(isOpen) => !isOpen && closeDialog()}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit learner" : "Invite learner"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details, role, and which portal tabs this learner can open."
              : "Invite by email only. They set their name when they accept; you choose portal tabs now."}
          </DialogDescription>
        </DialogHeader>
        {isEdit ? (
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(saveEdit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
              {portalAccessBlock}
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...inviteForm}>
            <form
              onSubmit={inviteForm.handleSubmit(saveInvite)}
              className="space-y-4"
            >
              <FormField
                control={inviteForm.control}
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
              <FormField
                control={inviteForm.control}
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
              {portalAccessBlock}
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">Send invite</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

const enrollSchema = z.object({
  CourseId: z.string().min(1, "Course is required"),
});

function EnrollDialog() {
  const { open, currentId, closeDialog } = useLearners();
  const learner = useLearnersStore((state) =>
    state.learners.find((item) => item.Id === currentId),
  );
  const enroll = useLearnersStore((state) => state.enroll);

  const form = useForm<z.infer<typeof enrollSchema>>({
    resolver: zodResolver(enrollSchema),
    defaultValues: { CourseId: "" },
  });

  useEffect(() => {
    if (open === LearnersDialogType.Enroll) form.reset({ CourseId: "" });
  }, [open, form]);

  const available = MOCK_COURSES.filter(
    (course) => !learner?.Enrollments.some((e) => e.CourseId === course.Id),
  );

  function onSubmit({ CourseId }: z.infer<typeof enrollSchema>) {
    if (!learner) return;
    enroll(learner.Id, CourseId);
    toast.success(`${learner.Name} enrolled.`);
    closeDialog();
  }

  return (
    <Dialog
      open={open === LearnersDialogType.Enroll}
      onOpenChange={(isOpen) => !isOpen && closeDialog()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll in a course</DialogTitle>
          <DialogDescription>
            {learner
              ? `Choose a course for ${learner.Name}.`
              : "Choose a course."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="CourseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={available.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            available.length === 0
                              ? "Already enrolled in every course"
                              : "Select a course"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {available.map((course) => (
                        <SelectItem key={course.Id} value={course.Id}>
                          {course.Title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  available.length === 0 ||
                  learner?.Status === LearnerStatus.Disabled
                }
              >
                Enroll
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function LearnersDialogs() {
  return (
    <>
      <LearnerFormDialog />
      <EnrollDialog />
    </>
  );
}
