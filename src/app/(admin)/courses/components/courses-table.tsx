"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { useFetchCourses } from "@/store/server/courses/queries";
import { columns } from "./columns";
import { CoursesPrimaryButtons } from "./courses-primary-buttons";

export function CoursesTable() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useFetchCourses({ page, limit, search });

  const total = data?.TotalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <DataTable
      columns={columns}
      data={data?.Items ?? []}
      isLoading={isLoading}
      title={`Total Courses (${total})`}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(0);
      }}
      searchPlaceholder="Search courses"
      page={page}
      pageCount={pageCount}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={(value) => {
        setLimit(value);
        setPage(0);
      }}
      emptyIcon={BookOpen}
      emptyTitle={search ? "No matching courses" : "No courses yet"}
      emptyDescription={
        search
          ? "Try a different search term."
          : "Create your first course to get started."
      }
      emptyAction={!search ? <CoursesPrimaryButtons /> : undefined}
    />
  );
}
