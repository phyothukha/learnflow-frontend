"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useFetchCourses } from "@/store/server/courses/queries";
import type { Course } from "@/store/server/courses/interface";
import { useCourses } from "./courses-provider";

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
        cell: ({ row }) => <span className="font-medium">{row.original.Title}</span>,
      },
      {
        accessorKey: "Category",
        header: "Category",
        cell: ({ row }) => row.original.Category ?? <span className="text-muted-foreground">—</span>,
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
        cell: ({ row }) => format(new Date(row.original.CreatedAt), "dd MMM yyyy"),
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
    [hasPermission, setCurrentRow, setOpen]
  );

  const table = useReactTable({
    data: data?.value ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        {hasPermission(PERMISSIONS.COURSES_CREATE) && (
          <Button onClick={() => setOpen("create")}>
            <Plus />
            New Course
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No courses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} course{total === 1 ? "" : "s"} total
        </p>
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded-md border bg-transparent px-2 text-sm"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(0);
            }}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
