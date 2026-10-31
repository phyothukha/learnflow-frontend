import {
  MEMBER_PORTAL_PERMISSION_GROUPS,
  MEMBER_PORTAL_VIEW_CODES,
} from "@/lib/permission-groups";
import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";
import type { Member } from "@/store/client/mock/members-store";
import type { Role } from "@/store/client/mock/roles-store";

export const MEMBER_ACCESS_COOKIE = "learnflow-member-access";

export type MemberPortalTab = "dashboard" | "tasks" | "notes" | "teams";

export const MEMBER_PORTAL_TABS: {
  key: MemberPortalTab;
  label: string;
  viewCode: PermissionCode;
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    viewCode: PERMISSIONS.DASHBOARD_VIEW,
  },
  { key: "tasks", label: "Tasks", viewCode: PERMISSIONS.SCHEDULE_VIEW },
  { key: "notes", label: "Notes", viewCode: PERMISSIONS.NOTES_VIEW },
  { key: "teams", label: "Teams", viewCode: PERMISSIONS.TEAMS_VIEW },
];

export function getEffectiveMemberPermissions(
  member: Pick<Member, "CustomPermissions" | "RoleId">,
  roles: Role[],
): PermissionCode[] {
  if (member.CustomPermissions) return [...member.CustomPermissions];
  return [
    ...(roles.find((role) => role.Id === member.RoleId)?.Permissions ?? []),
  ];
}

export function getMemberPortalTabs(
  permissions: PermissionCode[],
): MemberPortalTab[] {
  const granted = new Set(permissions);
  return MEMBER_PORTAL_TABS.filter((tab) => granted.has(tab.viewCode)).map(
    (tab) => tab.key,
  );
}

export function summarizePortalAccess(permissions: PermissionCode[]): string {
  const tabs = getMemberPortalTabs(permissions);
  if (tabs.length === 0) return "No portal tabs";
  return tabs
    .map((key) => MEMBER_PORTAL_TABS.find((tab) => tab.key === key)?.label)
    .filter(Boolean)
    .join(", ");
}

/** Build email → effective permissions for the member portal cookie. */
export function buildMemberAccessMap(
  members: Member[],
  roles: Role[],
): Record<string, PermissionCode[]> {
  const map: Record<string, PermissionCode[]> = {};
  for (const member of members) {
    map[member.Email.trim().toLowerCase()] = getEffectiveMemberPermissions(
      member,
      roles,
    );
  }
  return map;
}

export function writeMemberAccessCookie(
  members: Member[],
  roles: Role[],
): void {
  if (typeof document === "undefined") return;
  const payload = JSON.stringify(buildMemberAccessMap(members, roles));
  document.cookie = [
    `${MEMBER_ACCESS_COOKIE}=${encodeURIComponent(payload)}`,
    "path=/",
    "max-age=31536000",
    "SameSite=Lax",
  ].join("; ");
}

export function filterToMemberPortalPermissions(
  permissions: PermissionCode[],
): PermissionCode[] {
  const allowed = new Set(
    MEMBER_PORTAL_PERMISSION_GROUPS.flatMap((group) =>
      group.items.map((item) => item.code),
    ),
  );
  // Keep library view codes if already on the role (not shown in portal checklist).
  for (const code of MEMBER_PORTAL_VIEW_CODES) allowed.add(code);
  return permissions.filter((code) => allowed.has(code));
}
