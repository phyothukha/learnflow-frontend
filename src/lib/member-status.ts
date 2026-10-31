import type { BadgeVariant } from "@/components/ui/badge";
import { MemberStatus } from "@/store/client/mock/members-store";

export const MEMBER_STATUS_VARIANT = new Map<MemberStatus, BadgeVariant>([
  [MemberStatus.Active, "status-green"],
  [MemberStatus.Invited, "status-amber"],
  [MemberStatus.Disabled, "status-slate"],
]);

export const MEMBER_STATUS_DOT = new Map<MemberStatus, string>([
  [MemberStatus.Active, "bg-emerald-500"],
  [MemberStatus.Invited, "bg-amber-500"],
  [MemberStatus.Disabled, "bg-slate-400"],
]);
