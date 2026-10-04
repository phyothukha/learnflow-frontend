import { create } from "zustand";
import { ALL_PERMISSION_CODES } from "@/lib/permission-groups";
import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";

export interface Role {
  Id: string;
  Name: string;
  Description: string;
  /** System roles cannot be renamed or deleted. */
  IsSystem: boolean;
  /** Locked roles cannot be changed at all. */
  IsLocked: boolean;
  Permissions: PermissionCode[];
}

export const SUPER_ADMIN_ROLE_ID = "role-super-admin";
export const LEARNER_ROLE_ID = "role-learner";

const P = PERMISSIONS;

const SEED_ROLES: Role[] = [
  {
    Id: SUPER_ADMIN_ROLE_ID,
    Name: "Super Admin",
    Description: "Full access to everything, including roles and permissions.",
    IsSystem: true,
    IsLocked: true,
    Permissions: [...ALL_PERMISSION_CODES],
  },
  {
    Id: "role-admin",
    Name: "Admin",
    Description: "Runs day-to-day operations. Cannot change roles.",
    IsSystem: false,
    IsLocked: false,
    Permissions: ALL_PERMISSION_CODES.filter(
      (code) =>
        code !== P.ROLES_CREATE &&
        code !== P.ROLES_UPDATE &&
        code !== P.ROLES_DELETE,
    ),
  },
  {
    Id: "role-content-manager",
    Name: "Content Manager",
    Description: "Maintains courses, lessons and library materials.",
    IsSystem: false,
    IsLocked: false,
    Permissions: [
      P.DASHBOARD_VIEW,
      P.COURSES_VIEW,
      P.COURSES_CREATE,
      P.COURSES_UPDATE,
      P.LESSONS_VIEW,
      P.LESSONS_CREATE,
      P.LESSONS_UPDATE,
      P.TOPICS_VIEW,
      P.TOPICS_CREATE,
      P.TOPICS_UPDATE,
      P.DOCUMENTS_VIEW,
      P.DOCUMENTS_CREATE,
      P.DOCUMENTS_UPDATE,
      P.NOTES_VIEW,
      P.NOTES_CREATE,
      P.NOTES_UPDATE,
      P.TEAMS_VIEW,
      P.TEAMS_CREATE,
      P.TEAMS_UPDATE,
    ],
  },
  {
    Id: "role-support",
    Name: "Support",
    Description: "Helps learners and manages their enrollments.",
    IsSystem: false,
    IsLocked: false,
    Permissions: [
      P.DASHBOARD_VIEW,
      P.ANALYTICS_VIEW,
      P.LEARNERS_VIEW,
      P.LEARNERS_UPDATE,
      P.COURSES_VIEW,
      P.ENROLLMENTS_VIEW,
      P.ENROLLMENTS_CREATE,
      P.ENROLLMENTS_UPDATE,
      P.ENROLLMENT_INFO_EMAIL_VIEW,
    ],
  },
  {
    Id: LEARNER_ROLE_ID,
    Name: "Learner",
    Description: "Default role for people using the learner portal.",
    IsSystem: true,
    IsLocked: false,
    Permissions: [
      P.DASHBOARD_VIEW,
      P.TOPICS_VIEW,
      P.DOCUMENTS_VIEW,
      P.NOTES_VIEW,
      P.NOTES_CREATE,
      P.NOTES_UPDATE,
      P.NOTES_DELETE,
      P.TEAMS_VIEW,
      P.TEAMS_CREATE,
      P.TEAMS_UPDATE,
      P.SCHEDULE_VIEW,
      P.SCHEDULE_CREATE,
      P.SCHEDULE_UPDATE,
      P.SCHEDULE_DELETE,
    ],
  },
];

export interface CreateRoleInput {
  Name: string;
  Description: string;
  CopyFromRoleId?: string;
  Permissions?: PermissionCode[];
}

interface RolesState {
  roles: Role[];
  createRole: (input: CreateRoleInput) => Role;
  updateRole: (
    id: string,
    patch: Partial<Pick<Role, "Name" | "Description" | "Permissions">>,
  ) => void;
  deleteRole: (id: string) => void;
}

export const useRolesStore = create<RolesState>()((set, get) => ({
  roles: SEED_ROLES,
  createRole: ({ Name, Description, CopyFromRoleId, Permissions }) => {
    const source = get().roles.find((role) => role.Id === CopyFromRoleId);
    const role: Role = {
      Id: crypto.randomUUID(),
      Name,
      Description,
      IsSystem: false,
      IsLocked: false,
      Permissions: Permissions
        ? [...Permissions]
        : source
          ? [...source.Permissions]
          : [],
    };
    set((state) => ({ roles: [...state.roles, role] }));
    return role;
  },
  updateRole: (id, patch) =>
    set((state) => ({
      roles: state.roles.map((role) => {
        if (role.Id !== id || role.IsLocked) return role;
        const { Name, ...rest } = patch;
        return {
          ...role,
          ...rest,
          ...(Name !== undefined && !role.IsSystem ? { Name } : {}),
        };
      }),
    })),
  deleteRole: (id) =>
    set((state) => ({
      roles: state.roles.filter((role) => role.Id !== id || role.IsSystem),
    })),
}));
