import {
  LayoutDashboard,
  BookOpen,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, type PermissionCode } from "@/lib/permissions";

export interface NavLink {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredPermissions: PermissionCode[];
}

export const navLinks: NavLink[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW],
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
];
