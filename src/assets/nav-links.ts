import {
  LayoutDashboard,
  BookOpen,
  Users,
  CalendarClock,
  FolderOpen,
  NotebookPen,
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
  {
    title: "Timeline",
    href: "/timeline",
    icon: CalendarClock,
    requiredPermissions: [PERMISSIONS.SCHEDULE_VIEW],
  },
  {
    title: "Library",
    href: "/library",
    icon: FolderOpen,
    requiredPermissions: [PERMISSIONS.DOCUMENTS_VIEW],
  },
  {
    title: "Notes",
    href: "/notes",
    icon: NotebookPen,
    requiredPermissions: [PERMISSIONS.NOTES_VIEW],
  },
];
