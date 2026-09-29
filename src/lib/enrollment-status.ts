import type { BadgeVariant } from "@/components/ui/badge";
import { EnrollmentStatus } from "@/store/server/enrollments/interface";

export const ENROLLMENT_STATUS_VARIANT = new Map<
  EnrollmentStatus,
  BadgeVariant
>([
  [EnrollmentStatus.Pending, "status-amber"],
  [EnrollmentStatus.Active, "status-green"],
  [EnrollmentStatus.Completed, "status-blue"],
  [EnrollmentStatus.Cancelled, "status-red"],
]);
