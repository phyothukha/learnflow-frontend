"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useFetchCourses } from "@/store/server/courses/queries";
import { getCoursesColumns } from "./courses-columns";
import { useCourses } from "./courses-provider";

export function CoursesCreateButton() {
  const { setOpen } = useCourses();
  const { hasPermission } = usePermission();

  if (!hasPermission(PERMISSIONS.COURSES_CREATE)) return null;

  return (
    <Button onClick={() => setOpen("create")}>
      <Plus />
      New Course
    </Button>
  );
}

export function CoursesTable() {
  const { setOpen, setCurrentRow } = useCourses();
  const { hasPermission } = usePermission();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useFetchCourses({ page, limit, search });

  const total = data?.TotalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const columns = useMemo(
    () =>
      getCoursesColumns({
        hasPermission,
        setCurrentRow,
        setOpen,
      }),
    [hasPermission, setCurrentRow, setOpen],
  );

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
      emptyAction={!search ? <CoursesCreateButton /> : undefined}
    />
  );
}
