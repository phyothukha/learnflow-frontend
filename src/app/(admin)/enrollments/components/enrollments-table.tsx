"use client";

import { useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "@/components/data-table-faceted-filter";
import { usePermission } from "@/hooks/use-permission";
import { ENROLLMENT_STATUS_DOT } from "@/lib/enrollment-status";
import { PERMISSIONS } from "@/lib/permissions";
import { EnrollmentStatus } from "@/store/server/enrollments/interface";
import { useFetchEnrollments } from "@/store/server/enrollments/queries";
import { toOrderBy } from "@/utils/query";
import { columns } from "./columns";
import { EnrollmentsPrimaryButtons } from "./enrollments-primary-buttons";

const ENROLLMENT_SORT_FIELDS = new Map([["Course", "Course/Title"]]);

const STATUS_OPTIONS: FacetedFilterOption<EnrollmentStatus>[] = Object.values(
  EnrollmentStatus,
).map((status) => ({
  value: status,
  label: status,
  dotClass: ENROLLMENT_STATUS_DOT.get(status),
}));

export function EnrollmentsTable() {
  const { hasPermission } = usePermission();
  const canViewEmail = hasPermission(PERMISSIONS.ENROLLMENT_INFO_EMAIL_VIEW);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statuses, setStatuses] = useState<EnrollmentStatus[]>([]);

  const { data, isLoading } = useFetchEnrollments({
    page,
    limit,
    search,
    status: statuses.join(",") || undefined,
    orderby: toOrderBy(sorting, ENROLLMENT_SORT_FIELDS),
  });

  const total = data?.["@odata.count"] ?? 0;
  const isFiltered = statuses.length > 0;
  const hasQuery = isFiltered || !!search;

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(0);
    };

  return (
    <DataTable
      columns={columns}
      data={data?.value ?? []}
      getRowId={(enrollment) => enrollment.Id}
      isLoading={isLoading}
      title={`Total Enrollments (${total})`}
      search={search}
      onSearchChange={withPageReset(setSearch)}
      searchPlaceholder="Search by name or email"
      filters={
        <DataTableFacetedFilter
          title="Status"
          options={STATUS_OPTIONS}
          selected={statuses}
          onChange={withPageReset(setStatuses)}
        />
      }
      onResetFilters={
        isFiltered
          ? () => {
              setStatuses([]);
              setPage(0);
            }
          : undefined
      }
      page={page}
      total={total}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={withPageReset(setLimit)}
      sorting={sorting}
      onSortingChange={(updater) => {
        setSorting(updater);
        setPage(0);
      }}
      columnVisibility={{ StudentEmail: canViewEmail }}
      emptyIcon={Users}
      emptyTitle={hasQuery ? "No matching enrollments" : "No enrollments yet"}
      emptyDescription={
        hasQuery
          ? "Try a different name, email or filter."
          : "Enrolled students will show up here."
      }
      emptyAction={!hasQuery ? <EnrollmentsPrimaryButtons /> : undefined}
    />
  );
}
