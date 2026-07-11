"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import { FileText, NotebookPen, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchDocuments } from "@/store/server/documents/queries";
import { useFetchNotes } from "@/store/server/notes/queries";
import {
  useCreateNote,
  useDeleteNote,
  useUpdateNote,
} from "@/store/server/notes/mutations";
import type { Note } from "@/store/server/notes/interface";

const FALLBACK_COLOR = "#8b8b8b";

export default function NotesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.NOTES_VIEW);

  const activeTopicId = useWorkspaceStore((s) => s.activeTopicId);
  const setActiveTopic = useWorkspaceStore((s) => s.setActiveTopic);

  const { data: topicsData } = useFetchTopics({
    limit: 100,
    orderby: "Title asc",
  });

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  if (status !== "authenticated" || !canView) return null;

  const topics = topicsData?.value ?? [];
  const activeTopic = topics.find((t) => t.Id === activeTopicId) ?? null;

  // Context-aware workspace: without an active topic there is no context,
  // so prompt the user to pick one instead of showing everything.
  if (!activeTopic) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
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
                <Button size="sm" onClick={() => router.push("/library")}>
                  Create your first topic
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <NotesWorkspace
      key={activeTopic.Id}
      topicId={activeTopic.Id}
      topicTitle={activeTopic.Title}
      topicColor={activeTopic.Color ?? FALLBACK_COLOR}
    />
  );
}

function NotesWorkspace({
  topicId,
  topicTitle,
  topicColor,
}: {
  topicId: string;
  topicTitle: string;
  topicColor: string;
}) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const { data: notesData } = useFetchNotes({ topicId, limit: 100 });
  const { data: documentsData } = useFetchDocuments({ topicId, limit: 100 });
  const createNote = useCreateNote();

  const notes = notesData?.value ?? [];
  const documents = documentsData?.value ?? [];
  const selectedNote = notes.find((n) => n.Id === selectedNoteId) ?? null;

  const handleQuickCapture = () => {
    if (!quickTitle.trim()) return;
    createNote.mutate(
      { TopicId: topicId, Title: quickTitle.trim() },
      {
        onSuccess: (note) => {
          setQuickTitle("");
          setSelectedNoteId(note.Id);
        },
        onError: () => toast.error("Failed to create note"),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className="size-3 rounded-full"
          style={{ backgroundColor: topicColor }}
        />
        <h1 className="text-2xl font-semibold">Notes — {topicTitle}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card
          className="shadow-sm"
          style={{ borderTopColor: topicColor, borderTopWidth: 3 }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">In this context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickCapture()}
                placeholder="Jot something…"
              />
              <Button
                size="icon"
                onClick={handleQuickCapture}
                disabled={createNote.isPending}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <ScrollArea className="h-[420px]">
              <div className="space-y-1 pr-3">
                {notes.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No notes in this topic yet.
                  </p>
                )}
                {notes.map((note) => (
                  <button
                    key={note.Id}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                      selectedNoteId === note.Id && "bg-accent",
                    )}
                    onClick={() => setSelectedNoteId(note.Id)}
                  >
                    <p className="truncate font-medium">{note.Title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {dayjs(note.UpdatedAt).format("MMM D, HH:mm")}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.Id}
              note={selectedNote}
              onDeleted={() => setSelectedNoteId(null)}
            />
          ) : (
            <Card className="shadow-sm">
              <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Select a note or capture a new one to start writing.
              </CardContent>
            </Card>
          )}

          {documents.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Related materials
              </h2>
              <div className="flex flex-wrap gap-2">
                {documents.map((doc) => (
                  <a
                    key={doc.Id}
                    href={doc.FileUrl ?? "#"}
                    target={doc.FileUrl ? "_blank" : undefined}
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs hover:bg-accent"
                  >
                    <FileText className="size-3" />
                    {doc.Title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteEditor({
  note,
  onDeleted,
}: {
  note: Note;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(note.Title);
  const [content, setContent] = useState(note.Content ?? "");
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const isDirty = title !== note.Title || content !== (note.Content ?? "");

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    updateNote.mutate(
      { id: note.Id, payload: { Title: title.trim(), Content: content } },
      {
        onSuccess: () => toast.success("Note saved"),
        onError: () => toast.error("Failed to save note"),
      },
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mr-3 border-none px-0 text-base font-semibold shadow-none focus-visible:ring-0"
        />
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || updateNote.isPending}
          >
            <Save className="size-4" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={() =>
              deleteNote.mutate(note.Id, {
                onSuccess: () => {
                  toast.success("Note deleted");
                  onDeleted();
                },
              })
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write in Markdown…"
          className="min-h-[360px] resize-y font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}
