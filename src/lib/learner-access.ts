import {
  LEARNER_PORTAL_PERMISSION_GROUPS,
  LEARNER_PORTAL_VIEW_CODES,
} from "@/lib/permission-groups";
import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";
import type { Learner } from "@/store/client/mock/learners-store";
import type { Role } from "@/store/client/mock/roles-store";

export const LEARNER_ACCESS_COOKIE = "learnflow-learner-access";

export type LearnerPortalTab = "dashboard" | "tasks" | "notes" | "teams";

export const LEARNER_PORTAL_TABS: {
  key: LearnerPortalTab;
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

export function getEffectiveLearnerPermissions(
  learner: Pick<Learner, "CustomPermissions" | "RoleId">,
  roles: Role[],
): PermissionCode[] {
  if (learner.CustomPermissions) return [...learner.CustomPermissions];
  return [
    ...(roles.find((role) => role.Id === learner.RoleId)?.Permissions ?? []),
  ];
}

export function getLearnerPortalTabs(
  permissions: PermissionCode[],
): LearnerPortalTab[] {
  const granted = new Set(permissions);
  return LEARNER_PORTAL_TABS.filter((tab) => granted.has(tab.viewCode)).map(
    (tab) => tab.key,
  );
}

export function summarizePortalAccess(permissions: PermissionCode[]): string {
  const tabs = getLearnerPortalTabs(permissions);
  if (tabs.length === 0) return "No portal tabs";
  return tabs
    .map((key) => LEARNER_PORTAL_TABS.find((tab) => tab.key === key)?.label)
    .filter(Boolean)
    .join(", ");
}

/** Build email → effective permissions for the learner portal cookie. */
export function buildLearnerAccessMap(
  learners: Learner[],
  roles: Role[],
): Record<string, PermissionCode[]> {
  const map: Record<string, PermissionCode[]> = {};
  for (const learner of learners) {
    map[learner.Email.trim().toLowerCase()] = getEffectiveLearnerPermissions(
      learner,
      roles,
    );
  }
  return map;
}

export function writeLearnerAccessCookie(
  learners: Learner[],
  roles: Role[],
): void {
  if (typeof document === "undefined") return;
  const payload = JSON.stringify(buildLearnerAccessMap(learners, roles));
  document.cookie = [
    `${LEARNER_ACCESS_COOKIE}=${encodeURIComponent(payload)}`,
    "path=/",
    "max-age=31536000",
    "SameSite=Lax",
  ].join("; ");
}

export function filterToLearnerPortalPermissions(
  permissions: PermissionCode[],
): PermissionCode[] {
  const allowed = new Set(
    LEARNER_PORTAL_PERMISSION_GROUPS.flatMap((group) =>
      group.items.map((item) => item.code),
    ),
  );
  // Keep library view codes if already on the role (not shown in portal checklist).
  for (const code of LEARNER_PORTAL_VIEW_CODES) allowed.add(code);
  return permissions.filter((code) => allowed.has(code));
}
