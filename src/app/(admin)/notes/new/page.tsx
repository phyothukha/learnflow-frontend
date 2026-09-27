"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopicContextSwitcher } from "@/components/topic-context-switcher";
import { MarkdownSplitEditor } from "@/components/markdown/markdown-split-editor";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useCreateNote } from "@/store/server/notes/mutations";

export default function NewNotePage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.NOTES_CREATE);

  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);
  const { data: topicsData } = useFetchTopics({ limit: 100 });
  const createNote = useCreateNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (status === "authenticated" && !canCreate) router.replace("/forbidden");
  }, [status, canCreate, router]);

  if (status !== "authenticated" || !canCreate) return null;

  const topics = topicsData?.Items ?? [];
  const activeTopic = topics.find((t) => t.Id === activeTopicId) ?? null;

  const handleCreate = () => {
    if (!activeTopicId) {
      toast.error("Pick a topic first");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    createNote.mutate(
      {
        TopicId: activeTopicId,
        Title: title.trim(),
        Content: content.trim() || undefined,
      },
      {
        onSuccess: (note) => {
          toast.success("Note created");
          router.push(`/notes/${note.Id}`);
        },
        onError: () => toast.error("Failed to create note"),
      },
    );
  };

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="size-9" asChild>
            <Link href="/notes">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">New note</h1>
            <p className="text-sm text-muted-foreground">
              {activeTopic
                ? `Creating in ${activeTopic.Title}`
                : "Pick a topic to continue"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TopicContextSwitcher />
          {activeTopic && (
            <Button onClick={handleCreate} disabled={createNote.isPending}>
              {createNote.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Create note
            </Button>
          )}
        </div>
      </div>

      {!activeTopic ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <NotebookPen className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select a topic from the switcher, then write your note.
          </p>
        </div>
      ) : (
        <div className="flex h-[calc(100svh-12rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
            <div className="shrink-0 rounded-md bg-primary/10 p-1.5 text-primary">
              <NotebookPen className="size-4" />
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Key takeaways"
              autoFocus
              className="h-9 min-w-0 flex-1 border-none bg-transparent px-2 text-sm font-semibold shadow-none focus-visible:ring-0"
            />
          </div>
          <MarkdownSplitEditor
            value={content}
            onChange={setContent}
            onSave={handleCreate}
            className="min-h-0 flex-1 rounded-none border-0"
          />
        </div>
      )}
    </div>
  );
}
