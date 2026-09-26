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
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
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
    <div className="flex h-full min-h-0 flex-col rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <p className="font-semibold">Total Enrollments ({total})</p>
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email"
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
              <Users className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {search ? "No matching enrollments" : "No enrollments yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try a different name or email."
                  : "Enrolled students will show up here."}
              </p>
            </div>
            {!search && <EnrollmentsCreateButton />}
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
