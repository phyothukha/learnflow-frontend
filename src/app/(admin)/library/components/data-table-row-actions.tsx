"use client";

import type { Row } from "@tanstack/react-table";
import { MoreHorizontal, Settings2, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  DocumentStatus,
  type StudyDocument,
} from "@/store/server/documents/interface";
import {
  useDeleteDocument,
  useUpdateDocument,
} from "@/store/server/documents/mutations";
import {
  DocumentsDialogType,
  useDocuments,
} from "../context/documents-context";
import { DOCUMENT_STATUS_LABEL } from "./document-status-pill";

const STATUSES = Object.values(DocumentStatus);

export interface DocumentActionsProps {
  document: StudyDocument;
  className?: string;
}

export function DocumentActions({ document, className }: DocumentActionsProps) {
  const { setOpen, setCurrentRow } = useDocuments();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const { confirmDelete, dialogProps } = useConfirmDialog();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-7 text-muted-foreground", className)}
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
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
            {STATUSES.map((value) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {DOCUMENT_STATUS_LABEL[value]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(document);
              setOpen(DocumentsDialogType.Settings);
            }}
          >
            <Settings2 />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              confirmDelete({
                itemName: document.Title,
                successMessage: "Document deleted",
                errorMessage: "Failed to delete document",
                onConfirm: () => deleteDocument.mutateAsync(document.Id),
              })
            }
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Portal events still bubble to the card <Link> in grid view. */}
      <span className="contents" onClick={(e) => e.stopPropagation()}>
        <ConfirmDialog {...dialogProps} />
      </span>
    </>
  );
}

interface DataTableRowActionsProps {
  row: Row<StudyDocument>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  return (
    <div className="text-right" onClick={(e) => e.stopPropagation()}>
      <DocumentActions document={row.original} />
    </div>
  );
}
