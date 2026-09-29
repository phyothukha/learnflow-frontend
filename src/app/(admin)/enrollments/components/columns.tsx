"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  EnrollmentStatus,
  type Enrollment,
} from "@/store/server/enrollments/interface";
import { DataTableRowActions } from "./data-table-row-actions";

const STATUS_VARIANT: Record<EnrollmentStatus, BadgeVariant> = {
  [EnrollmentStatus.Pending]: "status-amber",
  [EnrollmentStatus.Active]: "status-green",
  [EnrollmentStatus.Completed]: "status-blue",
  [EnrollmentStatus.Cancelled]: "status-red",
};

export const columns: ColumnDef<Enrollment>[] = [
  {
    accessorKey: "StudentName",
    header: "Student",
    cell: ({ row }) => (
      <span
        className="block w-full truncate font-medium"
        title={row.original.StudentName}
      >
        {row.original.StudentName}
      </span>
    ),
  },
  {
    id: "StudentEmail",
    accessorKey: "StudentEmail",
    header: "Email",
    cell: ({ row }) => (
      <span
        className="block w-full truncate text-muted-foreground"
        title={row.original.StudentEmail}
      >
        {row.original.StudentEmail}
      </span>
    ),
  },
  {
    accessorKey: "Course",
    header: "Course",
    cell: ({ row }) =>
      row.original.Course?.Title ? (
        <span
          className="block w-full truncate"
          title={row.original.Course.Title}
        >
          {row.original.Course.Title}
        </span>
      ) : (
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
      const value = Math.min(100, Math.max(0, row.original.ProgressPercent));
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
    cell: ({ row }) => format(new Date(row.original.CreatedAt), "dd MMM yyyy"),
  },
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
