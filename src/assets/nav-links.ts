import {
  LayoutDashboard,
  BookOpen,
  Users,
  UsersRound,
  FolderOpen,
  GraduationCap,
  Lock,
  UserCog,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";

export interface NavLinkItem {
  link: string;
  label: string;
  title: string;
  icon: LucideIcon;
  requiredPermissions: PermissionCode[];
}

export interface NavLinks {
  dashboard: NavLinkItem[];
  account: NavLinkItem[];
}

export const navLinks: NavLinks = {
  dashboard: [
    {
      link: "dashboard",
      label: "Dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW],
    },
    {
      link: "learners",
      label: "Learners",
      title: "Learners",
      icon: GraduationCap,
      requiredPermissions: [PERMISSIONS.LEARNERS_VIEW],
    },
    {
      link: "courses",
      label: "Courses",
      title: "Courses",
      icon: BookOpen,
      requiredPermissions: [PERMISSIONS.COURSES_VIEW],
    },
    {
      link: "enrollments",
      label: "Enrollments",
      title: "Enrollments",
      icon: Users,
      requiredPermissions: [PERMISSIONS.ENROLLMENTS_VIEW],
    },
    {
      link: "teams",
      label: "Teams",
      title: "Teams",
      icon: UsersRound,
      requiredPermissions: [PERMISSIONS.TEAMS_VIEW],
    },
    {
      link: "library",
      label: "Library",
      title: "Library",
      icon: FolderOpen,
      requiredPermissions: [PERMISSIONS.DOCUMENTS_VIEW],
    },
  ],
  account: [
    {
      link: "profile",
      label: "Profile",
      title: "Profile",
      icon: UserRound,
      requiredPermissions: [PERMISSIONS.ROLES_VIEW],
    },
    {
      link: "user-management",
      label: "User Management",
      title: "User Management",
      icon: UserCog,
      requiredPermissions: [PERMISSIONS.ROLES_VIEW],
    },
    {
      link: "roles-and-permissions",
      label: "Roles & Permissions",
      title: "Roles & Permissions",
      icon: Lock,
      requiredPermissions: [PERMISSIONS.ROLES_VIEW],
    },
  ],
};

export function hrefForNavLink(
  item: NavLinkItem,
  section: keyof NavLinks,
): string {
  if (section === "account") return `/account/${item.link}`;
  if (item.link === "dashboard") return "/dashboard";
  return `/${item.link}`;
}

export function accountNavItems() {
  return navLinks.account.map((item) => ({
    ...item,
    href: hrefForNavLink(item, "account"),
  }));
}

export function dashboardNavItems() {
  return navLinks.dashboard.map((item) => ({
    ...item,
    href: hrefForNavLink(item, "dashboard"),
  }));
}
