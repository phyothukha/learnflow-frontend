"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { NotebookPen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WidgetHeader } from "./widget-header";

export function NotepadWidget({
  topicTitle,
  topicColor,
  notes,
  className,
}: {
  topicTitle: string | null;
  topicColor: string;
  notes: { Id: string; Title: string; UpdatedAt: string }[];
  className?: string;
}) {
  return (
    <Card
      className={cn("shadow-sm", className)}
      style={
        topicTitle
          ? { borderTopColor: topicColor, borderTopWidth: 3 }
          : undefined
      }
    >
      <WidgetHeader
        title={topicTitle ? `Notes — ${topicTitle}` : "Notes"}
        href="/notes"
        linkLabel="Open workspace"
      />
      <CardContent>
        {!topicTitle ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <NotebookPen className="size-6" />
            <p className="text-center text-sm">
              Pick a topic in the top bar to start focused notes.
            </p>
          </div>
        ) : notes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No notes in this context yet.
          </p>
        ) : (
          <div className="space-y-1">
            {notes.map((note) => (
              <Link
                key={note.Id}
                href="/notes"
                className="block rounded-md px-3 py-2 hover:bg-accent"
              >
                <p className="truncate text-sm font-medium">{note.Title}</p>
                <p className="text-xs text-muted-foreground">
                  {dayjs(note.UpdatedAt).format("MMM D, HH:mm")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
