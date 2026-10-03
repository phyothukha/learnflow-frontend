import {
  LayoutDashboard,
  BookOpen,
  Users,
  UsersRound,
  FolderOpen,
  GraduationCap,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";

export interface NavLinkItem {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredPermissions: PermissionCode[];
}

export interface NavLinkGroup {
  title?: string;
  items: NavLinkItem[];
}

export const navLinks: NavLinkGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW],
      },
      {
        title: "Learners",
        href: "/learners",
        icon: GraduationCap,
        requiredPermissions: [PERMISSIONS.LEARNERS_VIEW],
      },
      {
        title: "Courses",
        href: "/courses",
        icon: BookOpen,
        requiredPermissions: [PERMISSIONS.COURSES_VIEW],
      },
      {
        title: "Enrollments",
        href: "/enrollments",
        icon: Users,
        requiredPermissions: [PERMISSIONS.ENROLLMENTS_VIEW],
      },
      {
        title: "Teams",
        href: "/teams",
        icon: UsersRound,
        requiredPermissions: [PERMISSIONS.TEAMS_VIEW],
      },
      {
        title: "Library",
        href: "/library",
        icon: FolderOpen,
        requiredPermissions: [PERMISSIONS.DOCUMENTS_VIEW],
      },
    ],
  },
  {
    title: "Access",
    items: [
      {
        title: "Roles & Permissions",
        href: "/roles",
        icon: ShieldCheck,
        requiredPermissions: [PERMISSIONS.ROLES_VIEW],
      },
    ],
  },
];
