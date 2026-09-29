"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Badge, tagVariant } from "@/components/ui/badge";
import { DocumentKindIcon } from "@/components/document-kind-icon";
import {
  getDocumentKind,
  getExtensionLabel,
  KIND_META,
} from "@/lib/document-types";
import { cn } from "@/lib/utils";
import type { StudyDocument } from "@/store/server/documents/interface";
import { DataTableRowActions } from "./data-table-row-actions";
import { DocumentStatusPill } from "./document-status-pill";

export const columns: ColumnDef<StudyDocument>[] = [
  {
    accessorKey: "Title",
    header: "Name",
    cell: ({ row }) => {
      const doc = row.original;
      const kind = getDocumentKind(doc.FileType);
      const meta = KIND_META[kind];
      return (
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("shrink-0 rounded-md p-1.5", meta.className)}>
            <DocumentKindIcon kind={kind} size={16} />
          </div>
          <Link
            href={`/library/${doc.TopicId}/${doc.Id}`}
            className="truncate font-medium hover:underline hover:underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            {doc.Title}
          </Link>
        </div>
      );
    },
  },
  {
    id: "Type",
    accessorKey: "FileType",
    header: "Type",
    cell: ({ row }) => {
      const kind = getDocumentKind(row.original.FileType);
      return (
        <span className="text-muted-foreground">
          {KIND_META[kind].label}
          <span className="ml-1.5 rounded border px-1 py-px text-[10px]">
            {getExtensionLabel(row.original.FileType)}
          </span>
        </span>
      );
    },
  },
  {
    accessorKey: "Status",
    header: "Status",
    cell: ({ row }) => <DocumentStatusPill status={row.original.Status} />,
  },
  {
    id: "Tags",
    accessorKey: "Tags",
    header: "Tags",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.Tags.slice(0, 3).map((tag) => (
          <Badge
            key={tag}
            variant={tagVariant(tag)}
            className="h-5 px-1.5 text-[10px]"
          >
            {tag}
          </Badge>
        ))}
        {row.original.Tags.length === 0 && (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "UpdatedAt",
    header: "Updated",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {dayjs(row.original.UpdatedAt).format("MMM D, YYYY")}
      </span>
    ),
  },
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
