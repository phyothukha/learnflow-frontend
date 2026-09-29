"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { ArrowUpRight } from "lucide-react";
import { DocumentKindIcon } from "@/components/document-kind-icon";
import { getDocumentKind, KIND_META } from "@/lib/document-types";
import { cn } from "@/lib/utils";
import type { StudyDocument } from "@/store/server/documents/interface";
import { useFetchDocuments } from "@/store/server/documents/queries";

interface DocumentRelatedPanelProps {
  document: StudyDocument;
  topicId: string;
  className?: string;
}

export function DocumentRelatedPanel({
  document,
  topicId,
  className,
}: DocumentRelatedPanelProps) {
  const { data: documentsData } = useFetchDocuments({ limit: 500, topicId });

  const siblings = (documentsData?.Items ?? [])
    .filter(
      (d) =>
        d.Id !== document.Id &&
        (d.FolderId ?? null) === (document.FolderId ?? null),
    )
    .slice(0, 6);

  return (
    <aside className={cn("library-card p-3", className)}>
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        In this folder ({siblings.length})
      </p>
      {siblings.length === 0 ? (
        <p className="rounded-md border border-dashed py-3 text-center text-[11px] text-muted-foreground">
          No other files
        </p>
      ) : (
        <div className="space-y-1">
          {siblings.map((doc) => {
            const kind = getDocumentKind(doc.FileType);
            return (
              <Link
                key={doc.Id}
                href={`/library/${topicId}/${doc.Id}`}
                className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-accent/50"
              >
                <div
                  className={cn(
                    "shrink-0 rounded p-1",
                    KIND_META[kind].className,
                  )}
                >
                  <DocumentKindIcon kind={kind} size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{doc.Title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {dayjs(doc.UpdatedAt).format("MMM D")}
                  </p>
                </div>
                <ArrowUpRight className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
