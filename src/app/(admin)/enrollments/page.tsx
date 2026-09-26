"use client";

import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { EnrollmentsProvider } from "./components/enrollments-provider";
import { EnrollmentsTable } from "./components/enrollments-table";
import { EnrollmentsDialogs } from "./components/enrollments-dialogs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function EnrollmentsPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();

  const canView = hasPermission(PERMISSIONS.ENROLLMENTS_VIEW);

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  return (
    <EnrollmentsProvider>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Enrollments</h1>
        <EnrollmentsTable />
      </div>
      <EnrollmentsDialogs />
    </EnrollmentsProvider>
  );
}
