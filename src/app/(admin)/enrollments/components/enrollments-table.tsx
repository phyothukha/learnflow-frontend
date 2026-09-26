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
import { useFetchEnrollments } from "@/store/server/enrollments/queries";
import type {
  Enrollment,
  EnrollmentStatus,
} from "@/store/server/enrollments/interface";
import { useEnrollments } from "./enrollments-provider";

const STATUS_VARIANT: Record<
  EnrollmentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pending: "outline",
  Active: "default",
  Completed: "secondary",
  Cancelled: "destructive",
};

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

  const columns = useMemo<ColumnDef<Enrollment>[]>(() => {
    const cols: ColumnDef<Enrollment>[] = [
      {
        accessorKey: "StudentName",
        header: "Student",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.StudentName}</span>
        ),
      },
    ];

    if (canViewEmail) {
      cols.push({
        accessorKey: "StudentEmail",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.StudentEmail}
          </span>
        ),
      });
    }

    cols.push(
      {
        accessorKey: "Course",
        header: "Course",
        cell: ({ row }) =>
          row.original.Course?.Title ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "Status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.Status]}>
            {row.original.Status}
          </Badge>
        ),
      },
      {
        accessorKey: "ProgressPercent",
        header: "Progress",
        cell: ({ row }) => {
          const value = Math.min(
            100,
            Math.max(0, row.original.ProgressPercent),
          );
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{value}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: "CreatedAt",
        header: "Enrolled",
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
              {hasPermission(PERMISSIONS.ENROLLMENTS_UPDATE) && (
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
              {hasPermission(PERMISSIONS.ENROLLMENTS_DELETE) && (
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
    );

    return cols;
  }, [canViewEmail, hasPermission, setCurrentRow, setOpen]);

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
          placeholder="Search students..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        {hasPermission(PERMISSIONS.ENROLLMENTS_CREATE) && (
          <Button onClick={() => setOpen("create")}>
            <Plus />
            New Enrollment
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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No enrollments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} enrollment{total === 1 ? "" : "s"} total
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
