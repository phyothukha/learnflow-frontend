import { create } from "zustand";
import {
  LEARNER_ROLE_ID,
  SUPER_ADMIN_ROLE_ID,
} from "@/store/client/mock/roles-store";

export enum AdminUserStatus {
  Invited = "Invited",
  Active = "Active",
  Disabled = "Disabled",
}

export interface AdminUser {
  Id: string;
  Name: string;
  Email: string;
  RoleId: string;
  Status: AdminUserStatus;
  JoinedAt: string;
  LastLoginAt: string | null;
}

export interface InviteAdminUserInput {
  Email: string;
  RoleId: string;
  Name?: string;
}

export interface UpdateAdminUserInput {
  Name?: string;
  Email?: string;
  RoleId?: string;
}

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0]?.trim() || "User";
  return local
    .replace(/[._+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function assertStaffRole(roleId: string) {
  if (roleId === LEARNER_ROLE_ID) {
    throw new Error("Admin users cannot use the Learner role.");
  }
}

const SEED_ADMIN_USERS: AdminUser[] = [
  {
    Id: "au-01",
    Name: "Super Admin",
    Email: "admin@learnflow.app",
    RoleId: SUPER_ADMIN_ROLE_ID,
    Status: AdminUserStatus.Active,
    JoinedAt: "2026-01-10T08:00:00Z",
    LastLoginAt: "2026-10-03T09:15:00Z",
  },
  {
    Id: "au-02",
    Name: "Nandar Oo",
    Email: "nandar.oo@learnflow.app",
    RoleId: "role-admin",
    Status: AdminUserStatus.Active,
    JoinedAt: "2026-03-02T08:00:00Z",
    LastLoginAt: "2026-10-02T14:40:00Z",
  },
  {
    Id: "au-03",
    Name: "Ko Hein",
    Email: "ko.hein@learnflow.app",
    RoleId: "role-content-manager",
    Status: AdminUserStatus.Active,
    JoinedAt: "2026-04-18T08:00:00Z",
    LastLoginAt: "2026-09-28T11:05:00Z",
  },
  {
    Id: "au-04",
    Name: "Support Desk",
    Email: "support@learnflow.app",
    RoleId: "role-support",
    Status: AdminUserStatus.Invited,
    JoinedAt: "2026-09-20T08:00:00Z",
    LastLoginAt: null,
  },
];

interface AdminUsersState {
  users: AdminUser[];
  inviteUser: (input: InviteAdminUserInput) => AdminUser;
  updateUser: (id: string, patch: UpdateAdminUserInput) => void;
  setStatus: (id: string, status: AdminUserStatus) => void;
  deleteUser: (id: string) => void;
}

export const useAdminUsersStore = create<AdminUsersState>()((set) => ({
  users: SEED_ADMIN_USERS,
  inviteUser: ({ Email, RoleId, Name }) => {
    assertStaffRole(RoleId);
    const created: AdminUser = {
      Id: crypto.randomUUID(),
      Name: Name?.trim() || displayNameFromEmail(Email),
      Email: Email.trim(),
      RoleId,
      Status: AdminUserStatus.Invited,
      JoinedAt: new Date().toISOString(),
      LastLoginAt: null,
    };
    set((state) => ({ users: [created, ...state.users] }));
    return created;
  },
  updateUser: (id, patch) => {
    if (patch.RoleId) assertStaffRole(patch.RoleId);
    set((state) => ({
      users: state.users.map((user) =>
        user.Id === id ? { ...user, ...patch } : user,
      ),
    }));
  },
  setStatus: (id, status) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.Id === id ? { ...user, Status: status } : user,
      ),
    })),
  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((user) => user.Id !== id),
    })),
}));
