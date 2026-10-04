"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  MoreVertical,
  PanelLeft,
  PenLine,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentKindIcon } from "@/components/document-kind-icon";
import { DocumentKind, getKindMeta } from "@/lib/document-types";
import { cn } from "@/lib/utils";
import type { StudyDocument } from "@/store/server/documents/interface";
import { csvStats } from "@/utils/csv";
import { DocumentViewTabs, ViewMode } from "./document-view-tabs";

interface DocumentToolbarProps {
  document: StudyDocument;
  kind: DocumentKind;
  fileName: string;
  view: ViewMode;
  editing: boolean;
  fullscreen: boolean;
  showOutline: boolean;
  canDownload: boolean;
  onViewChange: (view: ViewMode) => void;
  onEdit: () => void;
  onToggleOutline: () => void;
  onToggleFullscreen: () => void;
  onDownload: () => void;
  onSettings: () => void;
}

export function DocumentToolbar({
  document,
  kind,
  fileName,
  view,
  editing,
  fullscreen,
  showOutline,
  canDownload,
  onViewChange,
  onEdit,
  onToggleOutline,
  onToggleFullscreen,
  onDownload,
  onSettings,
}: DocumentToolbarProps) {
  const [copied, setCopied] = useState(false);
  const content = document.Content ?? "";
  const isTextKind =
    kind === DocumentKind.Markdown || kind === DocumentKind.Csv;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2",
        fullscreen && "shrink-0 bg-card px-6 py-3",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {fullscreen ? (
          <div
            className={cn(
              "shrink-0 rounded-md p-1.5",
              getKindMeta(kind).className,
            )}
          >
            <DocumentKindIcon kind={kind} size={16} />
          </div>
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-sm font-semibold">{fileName}</span>
        {kind === DocumentKind.Csv && content && (
          <Badge variant="secondary" className="shrink-0 text-[11px]">
            {csvStats(content).rows} rows · {csvStats(content).columns} columns
          </Badge>
        )}
      </div>

      {fullscreen && (
        <div className="hidden items-center gap-2 md:flex">
          {kind === DocumentKind.Markdown &&
            view === ViewMode.Preview &&
            !editing && (
              <Button
                variant={showOutline ? "default" : "secondary"}
                size="sm"
                onClick={onToggleOutline}
              >
                <PanelLeft className="size-4" />
                Outline
              </Button>
            )}
          <DocumentViewTabs
            kind={kind}
            view={view}
            editing={editing}
            onViewChange={onViewChange}
          />
          {kind === DocumentKind.Markdown && !editing && (
            <Button size="sm" onClick={onEdit}>
              <PenLine className="size-4" />
              Edit
            </Button>
          )}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2">
        {isTextKind && content && !editing && (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs"
            title="Copy document content"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="size-7">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {canDownload && (
              <DropdownMenuItem onClick={onDownload}>
                <Download />
                Download
              </DropdownMenuItem>
            )}
            {document.FileUrl && (
              <DropdownMenuItem asChild>
                <a href={document.FileUrl} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Open in new tab
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onSettings}>
              <Settings2 />
              Document settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {isTextKind && (
          <Button
            variant={fullscreen ? "default" : "secondary"}
            size="icon"
            className="size-7"
            title={fullscreen ? "Exit full screen (Esc)" : "Full screen"}
            onClick={onToggleFullscreen}
          >
            {fullscreen ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
