"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  Enrollment,
  EnrollmentStatus,
} from "@/store/server/enrollments/interface";
import type { EnrollmentsColumnsProps } from "./enrollments-columns.props";

const STATUS_VARIANT: Record<
  EnrollmentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pending: "outline",
  Active: "default",
  Completed: "secondary",
  Cancelled: "destructive",
};

export function getEnrollmentsColumns({
  hasPermission,
  setCurrentRow,
  setOpen,
}: EnrollmentsColumnsProps): ColumnDef<Enrollment>[] {
  const columns: ColumnDef<Enrollment>[] = [
    {
      accessorKey: "StudentName",
      header: "Student",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.StudentName}</span>
      ),
    },
    {
      id: "StudentEmail",
      accessorKey: "StudentEmail",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.StudentEmail}
        </span>
      ),
    },
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
  ];

  return columns;
}
