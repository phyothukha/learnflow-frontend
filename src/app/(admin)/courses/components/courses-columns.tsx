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
import type { Course } from "@/store/server/courses/interface";
import {
  CoursesDialogType,
  type CoursesColumnsProps,
} from "./courses-columns.props";

export function getCoursesColumns({
  hasPermission,
  setCurrentRow,
  setOpen,
}: CoursesColumnsProps): ColumnDef<Course>[] {
  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "Title",
      header: "Title",
      cell: ({ row }) => (
        <span
          className="block w-full truncate font-medium"
          title={row.original.Title}
        >
          {row.original.Title}
        </span>
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
          <Badge variant="status-green">Published</Badge>
        ) : (
          <Badge variant="status-slate">Draft</Badge>
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
                  setOpen(CoursesDialogType.Edit);
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
                  setOpen(CoursesDialogType.Delete);
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
