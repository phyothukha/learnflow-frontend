"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/store/server/courses/interface";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<Course>[] = [
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
      row.original.Category ?? <span className="text-muted-foreground">—</span>,
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
    cell: ({ row }) => format(new Date(row.original.CreatedAt), "dd MMM yyyy"),
  },
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
