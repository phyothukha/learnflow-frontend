"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/client/use-store";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchNotes } from "@/store/server/notes/queries";
import { useCreateNote } from "@/store/server/notes/mutations";

const FALLBACK_COLOR = "#8b8b8b";

export default function NotesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.NOTES_VIEW);
  const canCreate = hasPermission(PERMISSIONS.NOTES_CREATE);

  const { activeTopicId, setActiveTopic } = useWorkspaceStore();

  const { data: topicsData } = useFetchTopics({ limit: 100 });
  const { data: notesData } = useFetchNotes({
    topicId: activeTopicId ?? undefined,
    limit: 100,
  });
  const createNote = useCreateNote();

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  const topics = topicsData?.Items ?? [];
  const activeTopic = topics.find((t) => t.Id === activeTopicId) ?? null;
  const notes = notesData?.Items ?? [];

  if (!activeTopic) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 text-center">
        <NotebookPen className="size-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Pick a topic</p>
          <p className="text-xs text-muted-foreground">
            Choose a topic context to start taking notes.
          </p>
        </div>
        <div className="flex max-w-lg flex-wrap justify-center gap-2">
          {topics.map((topic) => (
            <Button
              key={topic.Id}
              variant="secondary"
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
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center gap-3 text-center text-muted-foreground",
        "library-card",
      )}
    >
      <NotebookPen className="size-8" />
      <p className="text-sm font-medium text-foreground">
        {notes.length === 0 ? "No notes yet" : "Select a note"}
      </p>
      <p className="text-xs">
        {notes.length === 0
          ? "Create a note to capture ideas for this topic."
          : "Or create a new one to start writing."}
      </p>
      {canCreate && (
        <Button
          size="sm"
          disabled={createNote.isPending}
          onClick={() =>
            createNote.mutate(
              { TopicId: activeTopic.Id, Title: "Untitled note" },
              { onSuccess: (note) => router.push(`/notes/${note.Id}`) },
            )
          }
        >
          New note
        </Button>
      )}
    </div>
  );
}
