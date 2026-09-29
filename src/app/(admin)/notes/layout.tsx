"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Search, SquarePen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchNotes } from "@/store/server/notes/queries";
import { useCreateNote } from "@/store/server/notes/mutations";
import type { Note } from "@/store/server/notes/interface";
import { libraryCardClassName } from "@/app/(admin)/library/components/library-card";

function previewText(content: string | null) {
  if (!content?.trim()) return "No content yet";
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`[\]()!~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface NoteGroup {
  label: string;
  items: Note[];
}

interface NotesLayoutProps {
  children: React.ReactNode;
}

function groupNotes(notes: Note[]) {
  const now = dayjs();
  const groups: NoteGroup[] = [
    { label: "Today", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Previous 30 Days", items: [] },
    { label: "Older", items: [] },
  ];
  for (const note of notes) {
    const updated = dayjs(note.UpdatedAt);
    const days = now.diff(updated, "day");
    if (updated.isSame(now, "day")) groups[0]!.items.push(note);
    else if (days <= 7) groups[1]!.items.push(note);
    else if (days <= 30) groups[2]!.items.push(note);
    else groups[3]!.items.push(note);
  }
  return groups.filter((g) => g.items.length > 0);
}

export default function NotesLayout({ children }: NotesLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.NOTES_CREATE);
  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);
  const [search, setSearch] = useState("");

  const { data: notesData, isLoading } = useFetchNotes({
    topicId: activeTopicId ?? undefined,
    limit: 100,
  });
  const createNote = useCreateNote();

  const header = (
    <PageHeader
      title="Notes"
      description="Capture ideas and summaries for the topic you're studying"
    />
  );

  if (!activeTopicId)
    return (
      <div className="flex h-full min-h-0 flex-col gap-6">
        {header}
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    );

  const activeNoteId = pathname.match(/^\/notes\/([^/]+)$/)?.[1];
  const showHeader = pathname === "/notes";
  const notes = notesData?.Items ?? [];
  const query = search.trim().toLowerCase();
  const visibleNotes = query
    ? notes.filter(
        (n) =>
          n.Title.toLowerCase().includes(query) ||
          n.Content?.toLowerCase().includes(query),
      )
    : notes;
  const groups = groupNotes(
    [...visibleNotes].sort(
      (a, b) => dayjs(b.UpdatedAt).valueOf() - dayjs(a.UpdatedAt).valueOf(),
    ),
  );

  const handleCreate = () => {
    createNote.mutate(
      { TopicId: activeTopicId, Title: "Untitled note" },
      { onSuccess: (note) => router.push(`/notes/${note.Id}`) },
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      {showHeader && header}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5">
        <aside
          className={cn(
            libraryCardClassName,
            "flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
            activeNoteId && "hidden lg:flex",
          )}
        >
          <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-9 bg-muted/40 pl-8"
              />
            </div>
            {canCreate && (
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                title="New note"
                onClick={handleCreate}
                disabled={createNote.isPending}
              >
                <SquarePen className="size-4" />
              </Button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <p className="px-2 py-10 text-center text-xs text-muted-foreground">
                {query ? `No notes match "${search}"` : "No notes yet."}
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.label} className="mb-1">
                  <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((note) => (
                      <li key={note.Id}>
                        <Link
                          href={`/notes/${note.Id}`}
                          className={cn(
                            "block min-w-0 overflow-hidden rounded-lg px-2.5 py-2 transition-colors hover:bg-accent/60",
                            activeNoteId === note.Id && "bg-accent",
                          )}
                        >
                          <p className="w-full truncate text-sm font-medium">
                            {note.Title}
                          </p>
                          <p className="w-full truncate text-xs text-muted-foreground">
                            {dayjs(note.UpdatedAt).format("MMM D")} ·{" "}
                            {previewText(note.Content)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </aside>
        <div
          className={cn("min-h-0 min-w-0", !activeNoteId && "hidden lg:block")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
