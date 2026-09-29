import type { PermissionCode } from "@/lib/permissions";
import type { Course } from "@/store/server/courses/interface";

export enum CoursesDialogType {
  Create = "create",
  Edit = "edit",
  Delete = "delete",
}

export interface CoursesColumnsProps {
  hasPermission: (permission: PermissionCode) => boolean;
  setCurrentRow: (row: Course | null) => void;
  setOpen: (type: CoursesDialogType | null) => void;
}
