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
  MoreHorizontal,
  PenLine,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownSplitEditor } from "@/components/markdown/markdown-split-editor";
import { MarkdownPreview } from "@/components/markdown/markdown-preview";
import { SourceView } from "@/app/(admin)/library/components/document-viewers";
import { libraryCardClassName } from "@/app/(admin)/library/components/library-card";
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
    return <Skeleton className="h-full min-h-0 rounded-xl" />;
  }

  if (isError || !note) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
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

  const goBack = () => {
    if (!confirmLeave()) return;
    router.push("/notes");
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden",
        libraryCardClassName,
      )}
    >
      <div className="flex shrink-0 items-center gap-1.5 border-b px-2 py-2 sm:gap-2 sm:px-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 lg:hidden"
          title="Back to notes"
          onClick={goBack}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="inline-flex min-w-0 items-center rounded-lg border bg-card p-0.5 shadow-xs">
          {(
            [
              { value: "preview" as const, label: "Preview", icon: Eye },
              { value: "normal" as const, label: "Source", icon: Code2 },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={editing}
              title={option.label}
              onClick={() => setView(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50 sm:px-3",
                view === option.value &&
                  !editing &&
                  "bg-muted text-foreground shadow-xs",
              )}
            >
              <option.icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
          {editing && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-sm font-medium text-primary-foreground sm:px-3">
              <PenLine className="size-4" />
              <span className="hidden sm:inline">Editing</span>
            </span>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {canUpdate && !editing && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Edit note"
              onClick={() => setEditing(true)}
            >
              <PenLine className="size-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {content && !editing && (
                <DropdownMenuItem
                  onClick={async () => {
                    await navigator.clipboard.writeText(content);
                    setCopied(true);
                    toast.success("Copied");
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  Copy content
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  {content && !editing && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={deleteNote.isPending}
                    onClick={handleDelete}
                  >
                    <Trash2 className="size-4" />
                    Delete note
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-w-0 shrink-0 space-y-1 overflow-hidden px-4 pt-4 pb-2 text-center sm:px-6 sm:pt-5">
          <p className="w-full truncate text-[11px] text-muted-foreground">
            {topic?.Title ? `${topic.Title} · ` : ""}
            {dayjs(note.UpdatedAt).format("MMM D, YYYY")}
          </p>
          {editing || canUpdate ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              readOnly={!editing}
              title={title}
              className="h-auto w-full min-w-0 border-none bg-transparent p-0 text-center text-xl font-semibold shadow-none focus-visible:ring-0 sm:text-2xl read-only:truncate"
            />
          ) : (
            <h1 className="w-full truncate text-xl font-semibold sm:text-2xl">
              {title}
            </h1>
          )}
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
              <div className="flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2.5 sm:px-4">
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
                  <span className="hidden sm:inline">
                    {updateNote.isPending
                      ? "Saving…"
                      : isDirty
                        ? "Unsaved changes"
                        : "All changes saved"}
                  </span>
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
                    Save
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
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
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
