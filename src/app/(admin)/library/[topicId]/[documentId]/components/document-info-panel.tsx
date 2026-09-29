"use client";

import {
  ArrowUpRight,
  Download,
  MoreHorizontal,
  PenLine,
  Settings2,
  Trash2,
} from "lucide-react";
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
import {
  getDocumentKind,
  getExtensionLabel,
  getKindMeta,
} from "@/lib/document-types";
import { cn } from "@/lib/utils";
import {
  DocumentStatus,
  type StudyDocument,
} from "@/store/server/documents/interface";
import { useUpdateDocument } from "@/store/server/documents/mutations";
import {
  DOCUMENT_STATUS_LABEL,
  DocumentStatusPill,
} from "../../../components/document-status-pill";
import { DocumentAttachments } from "./document-attachments";
import { QuickAction } from "./quick-action";

const STATUSES = Object.values(DocumentStatus);

interface DocumentInfoPanelProps {
  document: StudyDocument;
  canEdit: boolean;
  canDownload: boolean;
  onEdit: () => void;
  onDownload: () => void;
  onSettings: () => void;
  onDelete: () => void;
}

export function DocumentInfoPanel({
  document,
  canEdit,
  canDownload,
  onEdit,
  onDownload,
  onSettings,
  onDelete,
}: DocumentInfoPanelProps) {
  const updateDocument = useUpdateDocument();
  const kind = getDocumentKind(document.FileType);
  const meta = getKindMeta(kind);

  const setStatus = (value: string) =>
    updateDocument.mutate({
      id: document.Id,
      payload: { Status: value as DocumentStatus },
    });

  return (
    <aside className="library-card p-3">
      <div className="flex items-start gap-2.5">
        <div className={cn("shrink-0 rounded-lg p-2", meta.className)}>
          <DocumentKindIcon kind={kind} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-snug font-semibold">
            {document.Title}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {meta.label} · {getExtensionLabel(document.FileType)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Status
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={document.Status}
              onValueChange={setStatus}
            >
              {STATUSES.map((value) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {DOCUMENT_STATUS_LABEL[value]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSettings}>
              <Settings2 />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <DocumentStatusPill status={document.Status} className="text-[10px]" />
        <div className="flex items-center gap-1">
          <QuickAction
            icon={PenLine}
            label="Edit"
            onClick={onEdit}
            disabled={!canEdit}
          />
          <QuickAction
            icon={Download}
            label="Download"
            onClick={onDownload}
            disabled={!canDownload}
          />
          <QuickAction icon={Settings2} label="Settings" onClick={onSettings} />
          <QuickAction
            icon={Trash2}
            label="Delete"
            onClick={onDelete}
            destructive
          />
        </div>
      </div>

      {document.FileUrl && (
        <a
          href={document.FileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-primary hover:underline"
        >
          <span className="truncate">{document.FileUrl}</span>
          <ArrowUpRight className="size-3 shrink-0" />
        </a>
      )}

      <div className="mt-3 border-t pt-2.5">
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Attachments ({document.Attachments.length})
        </p>
        <DocumentAttachments document={document} />
      </div>
    </aside>
  );
}
