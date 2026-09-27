import type { PermissionCode } from "@/lib/permissions";
import type { Enrollment } from "@/store/server/enrollments/interface";
import type { EnrollmentsDialogType } from "./enrollments-provider";

export interface EnrollmentsColumnsProps {
  hasPermission: (permission: PermissionCode) => boolean;
  setCurrentRow: (row: Enrollment | null) => void;
  setOpen: (type: EnrollmentsDialogType) => void;
}
