"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  BookOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useFetchCourses } from "@/store/server/courses/queries";
import type { Course } from "@/store/server/courses/interface";
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

  const total = data?.["@odata.count"] ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: "Title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.Title}</span>
        ),
      },
      {
        accessorKey: "Category",
        header: "Category",
        cell: ({ row }) =>
          row.original.Category ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "IsPublished",
        header: "Status",
        cell: ({ row }) =>
          row.original.IsPublished ? (
            <Badge>Published</Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          ),
      },
      {
        accessorKey: "CreatedAt",
        header: "Created",
        cell: ({ row }) =>
          format(new Date(row.original.CreatedAt), "dd MMM yyyy"),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasPermission(PERMISSIONS.COURSES_UPDATE) && (
                <DropdownMenuItem
                  onClick={() => {
                    setCurrentRow(row.original);
                    setOpen("edit");
                  }}
                >
                  <Pencil />
                  Edit
                </DropdownMenuItem>
              )}
              {hasPermission(PERMISSIONS.COURSES_DELETE) && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setCurrentRow(row.original);
                    setOpen("delete");
                  }}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [hasPermission, setCurrentRow, setOpen],
  );

  const table = useReactTable({
    data: data?.value ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <p className="font-semibold">Total Courses ({total})</p>
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="rounded-full pl-9"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          {(isLoading || table.getRowModel().rows.length > 0) && (
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          )}
        </Table>

        {!isLoading && table.getRowModel().rows.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <BookOpen className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {search ? "No matching courses" : "No courses yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different search term."
                  : "Create your first course to get started."}
              </p>
            </div>
            {!search && <CoursesCreateButton />}
          </div>
        )}
      </div>

      <DataTablePagination
        page={page}
        pageCount={pageCount}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(0);
        }}
      />
    </div>
  );
}
