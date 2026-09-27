"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useFetchEnrollments } from "@/store/server/enrollments/queries";
import { getEnrollmentsColumns } from "./enrollments-columns";
import { useEnrollments } from "./enrollments-provider";

export function EnrollmentsCreateButton() {
  const { setOpen } = useEnrollments();
  const { hasPermission } = usePermission();

  if (!hasPermission(PERMISSIONS.ENROLLMENTS_CREATE)) return null;

  return (
    <Button onClick={() => setOpen("create")}>
      <Plus />
      New Enrollment
    </Button>
  );
}

export function EnrollmentsTable() {
  const { setOpen, setCurrentRow } = useEnrollments();
  const { hasPermission } = usePermission();
  const canViewEmail = hasPermission(PERMISSIONS.ENROLLMENT_INFO_EMAIL_VIEW);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useFetchEnrollments({ page, limit, search });

  const total = data?.["@odata.count"] ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const columns = useMemo(
    () =>
      getEnrollmentsColumns({
        hasPermission,
        setCurrentRow,
        setOpen,
      }),
    [hasPermission, setCurrentRow, setOpen],
  );

  return (
    <DataTable
      columns={columns}
      data={data?.value ?? []}
      isLoading={isLoading}
      title={`Total Enrollments (${total})`}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(0);
      }}
      searchPlaceholder="Search by name or email"
      page={page}
      pageCount={pageCount}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={(value) => {
        setLimit(value);
        setPage(0);
      }}
      columnVisibility={{ StudentEmail: canViewEmail }}
      emptyIcon={Users}
      emptyTitle={search ? "No matching enrollments" : "No enrollments yet"}
      emptyDescription={
        search
          ? "Try a different name or email."
          : "Enrolled students will show up here."
      }
      emptyAction={!search ? <EnrollmentsCreateButton /> : undefined}
    />
  );
}
