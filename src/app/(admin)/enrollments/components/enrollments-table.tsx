"use client";

import { useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useFetchEnrollments } from "@/store/server/enrollments/queries";
import { toOrderBy } from "@/utils/query";
import { columns } from "./columns";
import { EnrollmentsPrimaryButtons } from "./enrollments-primary-buttons";

const ENROLLMENT_SORT_FIELDS = new Map([["Course", "Course/Title"]]);

export function EnrollmentsTable() {
  const { hasPermission } = usePermission();
  const canViewEmail = hasPermission(PERMISSIONS.ENROLLMENT_INFO_EMAIL_VIEW);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useFetchEnrollments({
    page,
    limit,
    search,
    orderby: toOrderBy(sorting, ENROLLMENT_SORT_FIELDS),
  });

  const total = data?.["@odata.count"] ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

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
      sorting={sorting}
      onSortingChange={(updater) => {
        setSorting(updater);
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
      emptyAction={!search ? <EnrollmentsPrimaryButtons /> : undefined}
    />
  );
}
