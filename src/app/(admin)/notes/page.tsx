"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { NotebookPen, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TopicContextSwitcher } from "@/components/topic-context-switcher";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchNotes } from "@/store/server/notes/queries";
import { NoteCard } from "./components/note-card";

const FALLBACK_COLOR = "#8b8b8b";

export default function NotesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.NOTES_VIEW);
  const canCreate = hasPermission(PERMISSIONS.NOTES_CREATE);

  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);
  const setActiveTopic = useWorkspaceStore((s) => s.setActiveTopic);
  const [search, setSearch] = useState("");

  const { data: topicsData } = useFetchTopics({ limit: 100 });
  const { data: notesData, isLoading } = useFetchNotes({
    topicId: activeTopicId ?? undefined,
    limit: 100,
  });

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  const topics = topicsData?.Items ?? [];
  const activeTopic = topics.find((t) => t.Id === activeTopicId) ?? null;
  const topicColor = activeTopic?.Color ?? FALLBACK_COLOR;
  const notes = notesData?.Items ?? [];
  const query = search.trim().toLowerCase();
  const visibleNotes = query
    ? notes.filter(
        (n) =>
          n.Title.toLowerCase().includes(query) ||
          n.Content?.toLowerCase().includes(query),
      )
    : notes;

  if (!activeTopic) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16">
          <NotebookPen className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Pick a topic to enter a focused note-taking context.
          </p>
          <div className="flex max-w-lg flex-wrap justify-center gap-2">
            {topics.map((topic) => (
              <Button
                key={topic.Id}
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setActiveTopic(topic.Id)}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: topic.Color ?? FALLBACK_COLOR }}
                />
                {topic.Title}
              </Button>
            ))}
            {topics.length === 0 && (
              <Button size="sm" asChild>
                <Link href="/library">Create your first topic</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex size-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${topicColor}1f`, color: topicColor }}
          >
            <NotebookPen className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Notes</h1>
            <p className="text-sm text-muted-foreground">
              {notes.length} {notes.length === 1 ? "note" : "notes"} in{" "}
              {activeTopic.Title}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TopicContextSwitcher />
          {canCreate && (
            <Button asChild>
              <Link href="/notes/new">
                <Plus className="size-4" />
                New note
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…"
          className="h-10 pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : visibleNotes.length === 0 ? (
        <div className="flex min-h-[calc(100svh-16rem)] flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
          <NotebookPen className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {query ? `No notes match “${search}”` : "No notes yet"}
          </p>
          <p className="text-xs text-muted-foreground">
            {query
              ? "Try a different search term."
              : "Create a note to capture ideas for this topic."}
          </p>
          {!query && canCreate && (
            <Button size="sm" asChild>
              <Link href="/notes/new">
                <Plus className="size-4" />
                New note
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleNotes.map((note) => (
            <NoteCard key={note.Id} note={note} accentColor={topicColor} />
          ))}
        </div>
      )}
    </div>
  );
}
