import type { PermissionCode } from "@/lib/permissions";
import type { Course } from "@/store/server/courses/interface";

export type CoursesDialogType = "create" | "edit" | "delete" | null;

export interface CoursesColumnsProps {
  hasPermission: (permission: PermissionCode) => boolean;
  setCurrentRow: (row: Course | null) => void;
  setOpen: (type: CoursesDialogType) => void;
}
