"use client";

import dayjs from "dayjs";
import {
  ChevronsLeft,
  ChevronsRight,
  Folder,
  Maximize2,
  PenLine,
} from "lucide-react";
import { Badge, tagVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentKind } from "@/lib/document-types";
import type { StudyDocument } from "@/store/server/documents/interface";
import { DocumentViewTabs, type ViewMode } from "./document-view-tabs";

interface DocumentHeaderProps {
  document: StudyDocument;
  kind: DocumentKind;
  topicTitle?: string;
  topicColor: string;
  folderLabel: string;
  view: ViewMode;
  editing: boolean;
  showRelated: boolean;
  onViewChange: (view: ViewMode) => void;
  onEdit: () => void;
  onFullscreen: () => void;
  onToggleRelated: () => void;
}

export function DocumentHeader({
  document,
  kind,
  topicTitle,
  topicColor,
  folderLabel,
  view,
  editing,
  showRelated,
  onViewChange,
  onEdit,
  onFullscreen,
  onToggleRelated,
}: DocumentHeaderProps) {
  const isTextKind =
    kind === DocumentKind.Markdown || kind === DocumentKind.Csv;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {document.Title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: topicColor }}
            />
            {topicTitle ?? "Topic"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Folder className="size-3" />
            {folderLabel}
          </span>
          <span>{dayjs(document.UpdatedAt).format("MMM D, YYYY")}</span>
          {document.Tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant={tagVariant(tag)}
              className="h-5 px-1.5 text-[10px]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
        {isTextKind && (
          <Button
            variant="secondary"
            size="icon"
            className="size-8"
            title="Full screen"
            aria-label="Full screen"
            onClick={onFullscreen}
          >
            <Maximize2 className="size-4" />
          </Button>
        )}
        <Button
          variant="secondary"
          size="icon"
          className="hidden size-8 rounded-full lg:inline-flex"
          title={showRelated ? "Hide side panel" : "Show side panel"}
          onClick={onToggleRelated}
        >
          {showRelated ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
