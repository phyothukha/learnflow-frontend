"use client";

import { CheckCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WidgetHeader } from "./widget-header";

export function LibraryWidget({
  documents,
  contextLabel,
  className,
}: {
  documents: { Id: string; Title: string; Status: string }[];
  contextLabel: string;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <WidgetHeader
        title={`Library — ${contextLabel}`}
        href="/library"
        linkLabel="Open library"
      />
      <CardContent>
        {documents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No documents in this context.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.Id}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {doc.Title}
                </span>
                {doc.Status === "Completed" ? (
                  <CheckCircle className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {doc.Status === "InProgress" ? "In progress" : doc.Status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
