import type { BadgeVariant } from "@/components/ui/badge";
import { AdminUserStatus } from "@/store/client/mock/admin-users-store";

export const ADMIN_USER_STATUS_LABEL = new Map<AdminUserStatus, string>([
  [AdminUserStatus.Active, "Active"],
  [AdminUserStatus.Invited, "Invited"],
  [AdminUserStatus.Disabled, "Suspended"],
]);

export const ADMIN_USER_STATUS_VARIANT = new Map<AdminUserStatus, BadgeVariant>(
  [
    [AdminUserStatus.Active, "status-green"],
    [AdminUserStatus.Invited, "status-amber"],
    [AdminUserStatus.Disabled, "status-slate"],
  ],
);

export const ADMIN_USER_STATUS_DOT = new Map<AdminUserStatus, string>([
  [AdminUserStatus.Active, "bg-emerald-500"],
  [AdminUserStatus.Invited, "bg-amber-500"],
  [AdminUserStatus.Disabled, "bg-slate-400"],
]);
