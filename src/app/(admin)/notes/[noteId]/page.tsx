"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Eye,
  Loader2,
  NotebookPen,
  PenLine,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownSplitEditor } from "@/components/markdown/markdown-split-editor";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";
import { SourceView } from "@/app/(admin)/library/components/document-viewers";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useFetchNote } from "@/store/server/notes/queries";
import { useDeleteNote, useUpdateNote } from "@/store/server/notes/mutations";
import { useFetchTopics } from "@/store/server/topics/queries";

type ViewMode = "preview" | "normal";

export default function NoteDetailPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = use(params);
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.NOTES_VIEW);
  const canUpdate = hasPermission(PERMISSIONS.NOTES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.NOTES_DELETE);

  const { data: note, isLoading, isError } = useFetchNote(noteId);
  const { data: topicsData } = useFetchTopics({ limit: 100 });
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<ViewMode>("preview");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const dirtyRef = useRef(false);

  const isDirty =
    title !== (note?.Title ?? "") || content !== (note?.Content ?? "");
  dirtyRef.current = isDirty;

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  useEffect(() => {
    if (!note) return;
    setTitle(note.Title);
    setContent(note.Content ?? "");
    setHydrated(true);
  }, [note]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const confirmLeave = useCallback(() => {
    return !dirtyRef.current || window.confirm("Discard unsaved changes?");
  }, []);

  if (status !== "authenticated" || !canView) return null;

  if (isLoading || !hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[calc(100svh-12rem)] min-h-[420px] rounded-xl" />
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          This note could not be found.
        </p>
        <Button variant="outline" asChild>
          <Link href="/notes">Back to notes</Link>
        </Button>
      </div>
    );
  }

  const topic = topicsData?.Items.find((t) => t.Id === note.TopicId);

  const handleSave = (closeAfter = false) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    updateNote.mutate(
      { id: note.Id, payload: { Title: title.trim(), Content: content } },
      {
        onSuccess: () => {
          toast.success("Note saved");
          if (closeAfter) setEditing(false);
        },
        onError: () => toast.error("Failed to save note"),
      },
    );
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${note.Title}"?`)) return;
    deleteNote.mutate(note.Id, {
      onSuccess: () => {
        toast.success("Note deleted");
        router.push("/notes");
      },
      onError: () => toast.error("Failed to delete note"),
    });
  };

  const viewTabs = (
    <div className="inline-flex items-center rounded-lg border bg-card p-1 shadow-xs">
      {(
        [
          { value: "preview" as const, label: "Preview", icon: Eye },
          { value: "normal" as const, label: "Normal", icon: Code2 },
        ] as const
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={editing}
          onClick={() => setView(option.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
            view === option.value &&
              !editing &&
              "bg-muted text-foreground shadow-xs",
          )}
        >
          <option.icon className="size-4" />
          {option.label}
        </button>
      ))}
      {editing && (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground">
          <PenLine className="size-4" />
          Editing
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            asChild
          >
            <Link
              href="/notes"
              onClick={(e) => {
                if (!confirmLeave()) e.preventDefault();
              }}
            >
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">
              {topic?.Title ?? "Topic"} · Updated{" "}
              {dayjs(note.UpdatedAt).format("MMM D, YYYY HH:mm")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewTabs}
          {canUpdate && !editing && (
            <Button size="sm" onClick={() => setEditing(true)}>
              <PenLine className="size-4" />
              Edit note
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteNote.isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex h-[calc(100svh-12rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="shrink-0 rounded-md bg-primary/10 p-1.5 text-primary">
              <NotebookPen className="size-4" />
            </div>
            {editing || canUpdate ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={!editing && !canUpdate}
                className="h-9 min-w-0 flex-1 border-none bg-transparent px-2 text-sm font-semibold shadow-none focus-visible:ring-0"
              />
            ) : (
              <span className="truncate text-sm font-semibold">{title}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {content && !editing && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={async () => {
                  await navigator.clipboard.writeText(content);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {editing ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <MarkdownSplitEditor
                value={content}
                onChange={setContent}
                onSave={() => handleSave(false)}
                className="min-h-0 flex-1 rounded-none border-0"
              />
              <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3">
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      updateNote.isPending
                        ? "animate-pulse bg-amber-500"
                        : isDirty
                          ? "bg-amber-500"
                          : "bg-emerald-500",
                    )}
                  />
                  {updateNote.isPending
                    ? "Saving…"
                    : isDirty
                      ? "Unsaved changes"
                      : "All changes saved"}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!confirmLeave()) return;
                      setTitle(note.Title);
                      setContent(note.Content ?? "");
                      setEditing(false);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(true)}
                    disabled={updateNote.isPending}
                  >
                    {updateNote.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save changes
                  </Button>
                </div>
              </div>
            </div>
          ) : !content.trim() ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <p className="text-sm">This note is empty.</p>
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <PenLine className="size-4" />
                  Start writing
                </Button>
              )}
            </div>
          ) : view === "preview" ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
              <MarkdownPreview content={content} />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto py-3">
              <SourceView content={content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
