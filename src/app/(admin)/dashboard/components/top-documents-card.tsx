"use client";

import Link from "next/link";
import { FileText, Star } from "lucide-react";
import { DashboardCard, DashboardCardScroll } from "./dashboard-card";
import { DocumentKindIcon } from "@/components/document-kind-icon";
import { getDocumentKind, KIND_META } from "@/lib/document-types";
import { cn } from "@/lib/utils";
import type { StudyDocument } from "@/store/server/documents/interface";
import { DocumentStatusPill } from "@/app/(admin)/library/components/documents-columns";

const STATUS_SCORE: Record<string, number> = {
  Completed: 5,
  InProgress: 3.5,
  Unread: 2,
};

export function TopDocumentsCard({
  documents,
  className,
}: {
  documents: StudyDocument[];
  className?: string;
}) {
  const rows = [...documents]
    .sort(
      (a, b) =>
        b.TimeSpentMinutes - a.TimeSpentMinutes ||
        (STATUS_SCORE[b.Status] ?? 0) - (STATUS_SCORE[a.Status] ?? 0),
    )
    .slice(0, 5);

  return (
    <DashboardCard title="Top Documents" icon={FileText} className={className}>
      {rows.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No documents yet.
        </p>
      ) : (
        <DashboardCardScroll minWidth={440} className="mt-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((doc, index) => {
                const kind = getDocumentKind(doc.FileType);
                const score = STATUS_SCORE[doc.Status] ?? 2;
                return (
                  <tr
                    key={doc.Id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/library/${doc.TopicId}/${doc.Id}`}
                        className="flex items-center gap-2.5 hover:text-primary"
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
                            KIND_META[kind].className,
                          )}
                        >
                          <DocumentKindIcon kind={kind} size={16} />
                        </span>
                        <span className="line-clamp-1 font-medium">
                          {doc.Title}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 tabular-nums text-muted-foreground">
                      {doc.TimeSpentMinutes}m
                    </td>
                    <td className="py-3">
                      <DocumentStatusPill status={doc.Status} />
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DashboardCardScroll>
      )}
    </DashboardCard>
  );
}
