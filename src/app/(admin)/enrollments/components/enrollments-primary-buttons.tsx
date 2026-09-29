"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import {
  EnrollmentsDialogType,
  useEnrollments,
} from "../context/enrollments-context";

export function EnrollmentsPrimaryButtons() {
  const { setOpen } = useEnrollments();
  const { hasPermission } = usePermission();

  if (!hasPermission(PERMISSIONS.ENROLLMENTS_CREATE)) return null;

  return (
    <Button onClick={() => setOpen(EnrollmentsDialogType.Create)}>
      <Plus />
      New Enrollment
    </Button>
  );
}
