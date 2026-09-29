"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, tagVariant, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentKindIcon } from "@/components/document-kind-icon";
import { cn } from "@/lib/utils";
import {
  getDocumentKind,
  getExtensionLabel,
  KIND_META,
} from "@/lib/document-types";
import {
  useDeleteDocument,
  useUpdateDocument,
} from "@/store/server/documents/mutations";
import type {
  DocumentStatus,
  StudyDocument,
} from "@/store/server/documents/interface";
import type { DocumentsColumnsProps } from "./documents-columns.props";

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  Unread: "Unread",
  InProgress: "In progress",
  Completed: "Completed",
};

export const DOCUMENT_STATUS_VARIANT: Record<DocumentStatus, BadgeVariant> = {
  Unread: "status-slate",
  InProgress: "status-amber",
  Completed: "status-blue",
};

export function DocumentStatusPill({
  status,
  className,
}: {
  status: DocumentStatus;
  className?: string;
}) {
  return (
    <Badge variant={DOCUMENT_STATUS_VARIANT[status]} className={className}>
      {DOCUMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

export function DocumentActions({
  document,
  onSettings,
  className,
}: {
  document: StudyDocument;
  onSettings: () => void;
  className?: string;
}) {
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-7 text-muted-foreground", className)}
          onClick={(e) => e.preventDefault()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Status
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={document.Status}
          onValueChange={(value) =>
            updateDocument.mutate({
              id: document.Id,
              payload: { Status: value as DocumentStatus },
            })
          }
        >
          {(Object.keys(DOCUMENT_STATUS_LABEL) as DocumentStatus[]).map(
            (value) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {DOCUMENT_STATUS_LABEL[value]}
              </DropdownMenuRadioItem>
            ),
          )}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSettings}>
          <Settings2 />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            if (!window.confirm(`Delete "${document.Title}"?`)) return;
            deleteDocument.mutate(document.Id, {
              onSuccess: () => toast.success("Document deleted"),
              onError: () => toast.error("Failed to delete document"),
            });
          }}
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getDocumentsColumns({
  topicId,
  onSettings,
}: DocumentsColumnsProps): ColumnDef<StudyDocument>[] {
  const columns: ColumnDef<StudyDocument>[] = [
    {
      accessorKey: "Title",
      header: "Name",
      cell: ({ row }) => {
        const doc = row.original;
        const kind = getDocumentKind(doc.FileType);
        const meta = KIND_META[kind];
        const href = `/library/${topicId}/${doc.Id}`;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn("shrink-0 rounded-md p-1.5", meta.className)}>
              <DocumentKindIcon kind={kind} size={16} />
            </div>
            <Link
              href={href}
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
        const meta = KIND_META[kind];
        return (
          <span className="text-muted-foreground">
            {meta.label}
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
      cell: ({ row }) => (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <DocumentActions
            document={row.original}
            onSettings={() => onSettings(row.original)}
          />
        </div>
      ),
    },
  ];

  return columns;
}
