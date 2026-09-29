"use client";

import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentKind, getDocumentKind, KIND_META } from "@/lib/document-types";
import type { StudyDocument } from "@/store/server/documents/interface";
import {
  CsvTable,
  EmptyContent,
  LinkPanel,
  MarkdownPreview,
  OfficeFrame,
  PdfFrame,
  SourceView,
} from "../../../components/document-viewers";
import { ViewMode } from "./document-view-tabs";

interface DocumentBodyProps {
  document: StudyDocument;
  view: ViewMode;
  onEdit: () => void;
}

export function DocumentBody({ document, view, onEdit }: DocumentBodyProps) {
  const kind = getDocumentKind(document.FileType);
  const content = document.Content ?? "";

  if (kind === DocumentKind.Markdown) {
    if (!content.trim())
      return (
        <EmptyContent
          message="This document is empty."
          action={
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <PenLine className="size-4" />
              Start writing
            </Button>
          }
        />
      );
    return view === ViewMode.Preview ? (
      <div className="px-4 py-5 md:px-6">
        <MarkdownPreview content={content} />
      </div>
    ) : (
      <div className="py-3">
        <SourceView content={content} />
      </div>
    );
  }
  if (kind === DocumentKind.Csv) {
    if (!content.trim()) return <EmptyContent message="This file is empty." />;
    return view === ViewMode.Preview ? (
      <CsvTable content={content} />
    ) : (
      <div className="max-h-[70vh] overflow-auto py-3">
        <SourceView content={content} />
      </div>
    );
  }
  if (!document.FileUrl)
    return <EmptyContent message="No file is attached to this document yet." />;
  if (kind === DocumentKind.Pdf) return <PdfFrame url={document.FileUrl} />;
  if (kind === DocumentKind.Word || kind === DocumentKind.PowerPoint)
    return <OfficeFrame url={document.FileUrl} label={KIND_META[kind].label} />;
  return <LinkPanel url={document.FileUrl} />;
}
