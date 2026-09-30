"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { DataTable } from "@/components/data-table";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "@/components/data-table-faceted-filter";
import { useFetchCourses } from "@/store/server/courses/queries";
import { columns } from "./columns";
import { CoursesPrimaryButtons } from "./courses-primary-buttons";

enum CourseStatusFilter {
  Published = "published",
  Draft = "draft",
}

const STATUS_OPTIONS: FacetedFilterOption<CourseStatusFilter>[] = [
  {
    value: CourseStatusFilter.Published,
    label: "Published",
    dotClass: "bg-emerald-500",
  },
  { value: CourseStatusFilter.Draft, label: "Draft", dotClass: "bg-slate-400" },
];

export function CoursesTable() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<CourseStatusFilter[]>([]);

  const { data, isLoading } = useFetchCourses({
    page,
    limit,
    search,
    isPublished:
      statuses.length === 1
        ? statuses[0] === CourseStatusFilter.Published
        : undefined,
  });

  const total = data?.TotalCount ?? 0;
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
      data={data?.Items ?? []}
      getRowId={(course) => course.Id}
      isLoading={isLoading}
      title={`Total Courses (${total})`}
      search={search}
      onSearchChange={withPageReset(setSearch)}
      searchPlaceholder="Search courses"
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
      emptyIcon={BookOpen}
      emptyTitle={hasQuery ? "No matching courses" : "No courses yet"}
      emptyDescription={
        hasQuery
          ? "Try a different search term or filter."
          : "Create your first course to get started."
      }
      emptyAction={!hasQuery ? <CoursesPrimaryButtons /> : undefined}
    />
  );
}
