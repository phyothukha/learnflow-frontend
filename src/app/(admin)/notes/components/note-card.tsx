"use client";

import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/store/server/notes/interface";

dayjs.extend(relativeTime);

const noteCardClassName =
  "rounded-xl border-0 bg-card text-card-foreground shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] transition-all hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(15,23,42,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:ring-white/[0.06]";

function previewText(content: string | null) {
  if (!content?.trim()) return "No content yet — open to start writing.";
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`[\]()!~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function NoteCard({
  note,
  accentColor,
  className,
}: {
  note: Note;
  accentColor?: string;
  className?: string;
}) {
  const color = accentColor ?? "#007c6a";

  return (
    <Link
      href={`/notes/${note.Id}`}
      className={cn(
        "group flex min-h-[200px] flex-col gap-5 p-6 md:p-7",
        noteCardClassName,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 min-w-0 text-base leading-snug font-semibold">
          {note.Title}
        </h2>
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          <NotebookPen className="size-5" strokeWidth={1.75} />
        </div>
      </div>

      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {previewText(note.Content)}
      </p>

      <p className="text-xs text-muted-foreground">
        Last updated — {dayjs(note.UpdatedAt).fromNow()}
      </p>
    </Link>
  );
}
