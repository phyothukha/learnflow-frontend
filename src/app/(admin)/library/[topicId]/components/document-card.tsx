"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { ArrowUpRight, Calendar, CircleDashed, FileType } from "lucide-react";
import { Badge, tagVariant } from "@/components/ui/badge";
import { DocumentKindIcon } from "@/components/document-kind-icon";
import {
  getDocumentKind,
  getExtensionLabel,
  getKindMeta,
} from "@/lib/document-types";
import { cn } from "@/lib/utils";
import type { StudyDocument } from "@/store/server/documents/interface";
import { DocumentActions } from "../../components/data-table-row-actions";
import { DocumentStatusPill } from "../../components/document-status-pill";

interface DocumentCardProps {
  document: StudyDocument;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const kind = getDocumentKind(document.FileType);
  const meta = getKindMeta(kind);

  return (
    <Link
      href={`/library/${document.TopicId}/${document.Id}`}
      className="library-card group flex min-h-[220px] flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(15,23,42,0.1)]"
    >
      <div className="flex items-start gap-4">
        <div className={cn("shrink-0 rounded-xl p-3", meta.className)}>
          <DocumentKindIcon kind={kind} size={28} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-2 text-base leading-snug font-semibold">
            {document.Title}
          </p>
          <p className="text-xs text-muted-foreground">
            {meta.label} · {getExtensionLabel(document.FileType)}
          </p>
        </div>
        <DocumentActions document={document} className="-mt-1 -mr-1 shrink-0" />
      </div>

      <dl className="space-y-2.5 rounded-xl border bg-muted/40 p-4 text-sm">
        <div className="flex items-center">
          <dt className="flex w-24 items-center gap-1.5 text-muted-foreground">
            <FileType className="size-4" />
            Type
          </dt>
          <dd className="font-medium">
            {meta.label}
            <span className="ml-1.5 rounded border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {getExtensionLabel(document.FileType)}
            </span>
          </dd>
        </div>
        <div className="flex items-center">
          <dt className="flex w-24 items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-4" />
            Updated
          </dt>
          <dd className="font-medium">
            {dayjs(document.UpdatedAt).format("MMM D, YYYY")}
          </dd>
        </div>
        <div className="flex items-center">
          <dt className="flex w-24 items-center gap-1.5 text-muted-foreground">
            <CircleDashed className="size-4" />
            Status
          </dt>
          <dd>
            <DocumentStatusPill status={document.Status} />
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {document.Tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant={tagVariant(tag)}
              className="h-6 max-w-28 truncate px-2 text-[11px]"
            >
              {tag}
            </Badge>
          ))}
          {document.Tags.length > 2 && (
            <span className="text-[11px] leading-6 text-muted-foreground">
              +{document.Tags.length - 2}
            </span>
          )}
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}
