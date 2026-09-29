"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Folder,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelLeft,
  Paperclip,
  PenLine,
  Settings2,
  Table2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, tagVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentKindIcon } from "@/components/document-kind-icon";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { FALLBACK_TOPIC_COLOR } from "@/lib/topic-colors";
import {
  getDocumentKind,
  getExtensionLabel,
  KIND_META,
  MAX_UPLOAD_BYTES,
} from "@/lib/document-types";
import {
  useFetchDocument,
  useFetchDocuments,
} from "@/store/server/documents/queries";
import {
  useDeleteAttachment,
  useDeleteDocument,
  useUpdateDocument,
  useUploadAttachment,
} from "@/store/server/documents/mutations";
import type {
  DocumentStatus,
  StudyDocument,
} from "@/store/server/documents/interface";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchFolderTree } from "@/store/server/topic-folders/queries";
import { DocumentDetailDialog } from "../../components/document-detail-dialog";
import { DocumentStatusPill } from "../../components/documents-columns";
import { findFolderPath } from "../../components/folder-explorer";
import { libraryCardClassName } from "../../components/library-card";
import {
  CsvTable,
  csvStats,
  DocumentOutline,
  downloadText,
  downloadFromUrl,
  EmptyContent,
  extractHeadings,
  LinkPanel,
  MarkdownEditorPanel,
  MarkdownPreview,
  OfficeFrame,
  PdfFrame,
  SourceView,
} from "../../components/document-viewers";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  Unread: "Unread",
  InProgress: "In progress",
  Completed: "Completed",
};

type ViewMode = "preview" | "normal";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string; documentId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { topicId, documentId } = use(params);
  const { edit } = use(searchParams);
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.DOCUMENTS_VIEW);

  const [view, setView] = useState<ViewMode>("preview");
  const [editing, setEditing] = useState(edit === "1");
  const [showRelated, setShowRelated] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const dirtyRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const { data: document, isLoading, isError } = useFetchDocument(documentId);
  const { data: topicsData } = useFetchTopics({ limit: 100 });
  const { data: folderTree } = useFetchFolderTree(topicId);
  const deleteDocument = useDeleteDocument();

  const topicHref = `/library/${topicId}`;
  const topic = topicsData?.Items.find((t) => t.Id === topicId);
  const topicColor = topic?.Color ?? FALLBACK_TOPIC_COLOR;

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  if (status !== "authenticated" || !canView) return null;

  if (isLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <Skeleton className="h-[calc(100svh-6rem)] rounded-xl" />
        <Skeleton className="hidden h-[calc(100svh-6rem)] rounded-xl lg:block" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <FileText className="size-8" />
          <p className="text-sm">This document could not be found.</p>
          <Button variant="secondary" size="sm" asChild>
            <Link href={topicHref}>Back to topic</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const kind = getDocumentKind(document.FileType);
  const isTextKind = kind === "markdown" || kind === "csv";
  const content = document.Content ?? "";
  const folderPath = document.FolderId
    ? (findFolderPath(folderTree ?? [], document.FolderId) ?? [])
    : [];
  const fileName = `${document.Title}.${getExtensionLabel(document.FileType).toLowerCase()}`;

  const handleDownload = () => {
    const ext =
      kind === "csv"
        ? "csv"
        : kind === "markdown"
          ? "md"
          : getExtensionLabel(document.FileType).toLowerCase();
    const downloadName = `${document.Title}.${ext}`;
    if (isTextKind) {
      downloadText(
        content,
        downloadName,
        kind === "csv" ? "text/csv" : "text/markdown",
      );
    } else if (document.FileUrl) {
      downloadFromUrl(document.FileUrl, downloadName);
    }
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${document.Title}"?`)) return;
    deleteDocument.mutate(document.Id, {
      onSuccess: () => {
        toast.success("Document deleted");
        dirtyRef.current = false;
        router.push(topicHref);
      },
      onError: () => toast.error("Failed to delete document"),
    });
  };

  const canDownload = isTextKind || (!!document.FileUrl && kind !== "link");
  const viewOptions: { value: ViewMode; label: string; icon: typeof Eye }[] =
    isTextKind
      ? [
          {
            value: "preview",
            label: kind === "csv" ? "Table" : "Preview",
            icon: kind === "csv" ? Table2 : Eye,
          },
          { value: "normal", label: "Normal", icon: Code2 },
        ]
      : [{ value: "preview", label: "Preview", icon: Eye }];
  const headings = kind === "markdown" ? extractHeadings(content) : [];
  const scrollBody = fullscreen || isTextKind;
  const showOutlinePanel =
    fullscreen &&
    showOutline &&
    kind === "markdown" &&
    view === "preview" &&
    !editing &&
    !!content.trim();

  const viewTabs = (
    <div className="inline-flex items-center rounded-lg border bg-card p-1 shadow-xs">
      {viewOptions.map((option) => (
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
    <>
      <div
        className={cn(
          "grid items-start gap-3",
          showRelated && "lg:grid-cols-[minmax(0,1fr)_220px]",
        )}
      >
        <main className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h1 className="truncate text-xl font-semibold tracking-tight">
                {document.Title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: topicColor }}
                  />
                  {topic?.Title ?? "Topic"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Folder className="size-3" />
                  {folderPath.length
                    ? folderPath.map((f) => f.Name).join(" / ")
                    : "Top level"}
                </span>
                <span>{dayjs(document.UpdatedAt).format("MMM D, YYYY")}</span>
                {document.Tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant={tagVariant(tag)}
                    className="h-5 px-1.5 text-[10px]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {viewTabs}
              {kind === "markdown" && !editing && (
                <Button size="sm" onClick={() => setEditing(true)}>
                  <PenLine className="size-4" />
                  Edit
                </Button>
              )}
              {isTextKind && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8"
                  title="Full screen"
                  aria-label="Full screen"
                  onClick={() => setFullscreen(true)}
                >
                  <Maximize2 className="size-4" />
                </Button>
              )}
              <Button
                variant="secondary"
                size="icon"
                className="hidden size-8 rounded-full lg:inline-flex"
                title={showRelated ? "Hide side panel" : "Show side panel"}
                onClick={() => setShowRelated((v) => !v)}
              >
                {showRelated ? (
                  <ChevronsRight className="size-4" />
                ) : (
                  <ChevronsLeft className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden bg-card",
              fullscreen
                ? "fixed inset-0 z-50 flex flex-col bg-background"
                : libraryCardClassName,
              !fullscreen &&
                "flex h-[calc(100svh-7.5rem)] min-h-[480px] flex-col",
            )}
          >
            <div
              className={cn(
                "flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2",
                fullscreen && "shrink-0 bg-card px-6 py-3",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                {fullscreen ? (
                  <div
                    className={cn(
                      "shrink-0 rounded-md p-1.5",
                      KIND_META[kind].className,
                    )}
                  >
                    <DocumentKindIcon kind={kind} size={16} />
                  </div>
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-sm font-semibold">
                  {fileName}
                </span>
                {kind === "csv" && content && (
                  <Badge variant="secondary" className="shrink-0 text-[11px]">
                    {csvStats(content).rows} rows · {csvStats(content).columns}{" "}
                    columns
                  </Badge>
                )}
              </div>
              {fullscreen && (
                <div className="hidden items-center gap-2 md:flex">
                  {kind === "markdown" && view === "preview" && !editing && (
                    <Button
                      variant={showOutline ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setShowOutline((v) => !v)}
                    >
                      <PanelLeft className="size-4" />
                      Outline
                    </Button>
                  )}
                  {viewTabs}
                  {kind === "markdown" && !editing && (
                    <Button size="sm" onClick={() => setEditing(true)}>
                      <PenLine className="size-4" />
                      Edit
                    </Button>
                  )}
                </div>
              )}
              <div className="flex shrink-0 items-center gap-2">
                {isTextKind && content && !editing && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                    title="Copy document content"
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="size-7">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {canDownload && (
                      <DropdownMenuItem onClick={handleDownload}>
                        <Download />
                        Download
                      </DropdownMenuItem>
                    )}
                    {document.FileUrl && (
                      <DropdownMenuItem asChild>
                        <a
                          href={document.FileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink />
                          Open in new tab
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setShowSettings(true)}>
                      <Settings2 />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {isTextKind && (
                  <Button
                    variant={fullscreen ? "default" : "secondary"}
                    size="icon"
                    className="size-7"
                    title={
                      fullscreen ? "Exit full screen (Esc)" : "Full screen"
                    }
                    onClick={() => setFullscreen((v) => !v)}
                  >
                    {fullscreen ? (
                      <Minimize2 className="size-3.5" />
                    ) : (
                      <Maximize2 className="size-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className={cn(scrollBody && "flex min-h-0 flex-1")}>
              {showOutlinePanel && (
                <DocumentOutline
                  headings={headings}
                  scrollRef={scrollRef}
                  className="hidden w-64 shrink-0 border-r bg-muted/20 md:flex"
                />
              )}
              <div
                ref={scrollRef}
                className={cn(scrollBody && "min-h-0 flex-1 overflow-y-auto")}
              >
                {editing ? (
                  <MarkdownEditorPanel
                    document={document}
                    onDirtyChange={handleDirtyChange}
                    className={scrollBody ? "h-full min-h-0" : undefined}
                    onClose={() => {
                      dirtyRef.current = false;
                      setEditing(false);
                    }}
                  />
                ) : (
                  <DocumentBody
                    document={document}
                    view={view}
                    onEdit={() => setEditing(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </main>

        {showRelated && (
          <div className="min-w-0 space-y-3 lg:sticky lg:top-18">
            <InfoPanel
              document={document}
              canEdit={kind === "markdown"}
              canDownload={canDownload}
              onEdit={() => setEditing(true)}
              onDownload={handleDownload}
              onSettings={() => setShowSettings(true)}
              onDelete={handleDelete}
            />
            <RelatedPanel document={document} topicId={topicId} />
          </div>
        )}
      </div>

      {showSettings && (
        <DocumentDetailDialog
          document={document}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}

function DocumentBody({
  document,
  view,
  onEdit,
}: {
  document: StudyDocument;
  view: ViewMode;
  onEdit: () => void;
}) {
  const kind = getDocumentKind(document.FileType);
  const content = document.Content ?? "";

  if (kind === "markdown") {
    if (!content.trim())
      return (
        <EmptyContent
          message="This document is empty."
          action={
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <PenLine className="size-4" />
              Start writing
            </Button>
          }
        />
      );
    return view === "preview" ? (
      <div className="px-4 py-5 md:px-6">
        <MarkdownPreview content={content} />
      </div>
    ) : (
      <div className="py-3">
        <SourceView content={content} />
      </div>
    );
  }
  if (kind === "csv") {
    if (!content.trim()) return <EmptyContent message="This file is empty." />;
    return view === "preview" ? (
      <CsvTable content={content} />
    ) : (
      <div className="max-h-[70vh] overflow-auto py-3">
        <SourceView content={content} />
      </div>
    );
  }
  if (!document.FileUrl)
    return <EmptyContent message="No file is attached to this document yet." />;
  if (kind === "pdf") return <PdfFrame url={document.FileUrl} />;
  if (kind === "word" || kind === "powerpoint")
    return <OfficeFrame url={document.FileUrl} label={KIND_META[kind].label} />;
  return <LinkPanel url={document.FileUrl} />;
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  destructive,
}: {
  icon: typeof Eye;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        destructive && "hover:border-destructive/40 hover:text-destructive",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function InfoPanel({
  document,
  canEdit,
  canDownload,
  onEdit,
  onDownload,
  onSettings,
  onDelete,
}: {
  document: StudyDocument;
  canEdit: boolean;
  canDownload: boolean;
  onEdit: () => void;
  onDownload: () => void;
  onSettings: () => void;
  onDelete: () => void;
}) {
  const updateDocument = useUpdateDocument();
  const kind = getDocumentKind(document.FileType);
  const meta = KIND_META[kind];

  const setStatus = (value: string) =>
    updateDocument.mutate({
      id: document.Id,
      payload: { Status: value as DocumentStatus },
    });

  return (
    <aside className={cn("p-3", libraryCardClassName)}>
      <div className="flex items-start gap-2.5">
        <div className={cn("shrink-0 rounded-lg p-2", meta.className)}>
          <DocumentKindIcon kind={kind} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-snug font-semibold">
            {document.Title}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {meta.label} · {getExtensionLabel(document.FileType)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Status
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={document.Status}
              onValueChange={setStatus}
            >
              {(Object.keys(STATUS_LABEL) as DocumentStatus[]).map((value) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {STATUS_LABEL[value]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSettings}>
              <Settings2 />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <DocumentStatusPill status={document.Status} className="text-[10px]" />
        <div className="flex items-center gap-1">
          <QuickAction
            icon={PenLine}
            label="Edit"
            onClick={onEdit}
            disabled={!canEdit}
          />
          <QuickAction
            icon={Download}
            label="Download"
            onClick={onDownload}
            disabled={!canDownload}
          />
          <QuickAction icon={Settings2} label="Settings" onClick={onSettings} />
          <QuickAction
            icon={Trash2}
            label="Delete"
            onClick={onDelete}
            destructive
          />
        </div>
      </div>

      {document.FileUrl && (
        <a
          href={document.FileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-primary hover:underline"
        >
          <span className="truncate">{document.FileUrl}</span>
          <ArrowUpRight className="size-3 shrink-0" />
        </a>
      )}

      <div className="mt-3 border-t pt-2.5">
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Attachments ({document.Attachments.length})
        </p>
        <AttachmentsTab document={document} />
      </div>
    </aside>
  );
}

function AttachmentsTab({ document }: { document: StudyDocument }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  return (
    <div className="space-y-1.5">
      <Button
        variant="secondary"
        size="sm"
        className="h-7 w-full text-xs"
        disabled={uploadAttachment.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="size-3.5" />
        {uploadAttachment.isPending ? "Uploading…" : "Upload"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > MAX_UPLOAD_BYTES) {
            toast.error("File is too large (max 25 MB)");
            return;
          }
          uploadAttachment.mutate(
            { documentId: document.Id, file },
            {
              onSuccess: () => toast.success("Attachment uploaded"),
              onError: () => toast.error("Failed to upload attachment"),
            },
          );
        }}
      />
      {document.Attachments.length === 0 ? (
        <p className="rounded-md border border-dashed py-3 text-center text-[11px] text-muted-foreground">
          No attachments
        </p>
      ) : (
        document.Attachments.map((attachment) => (
          <div
            key={attachment.Id}
            className="group flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1.5"
          >
            <Paperclip className="size-3 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs">{attachment.FileName}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatSize(attachment.SizeBytes)}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Download"
              aria-label="Download"
              onClick={() =>
                downloadFromUrl(attachment.Url, attachment.FileName)
              }
            >
              <Download className="size-3.5" />
            </button>
            <button
              type="button"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() =>
                deleteAttachment.mutate(
                  { documentId: document.Id, attachmentId: attachment.Id },
                  {
                    onSuccess: () => toast.success("Attachment removed"),
                    onError: () => toast.error("Failed to remove attachment"),
                  },
                )
              }
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function RelatedPanel({
  document,
  topicId,
  className,
}: {
  document: StudyDocument;
  topicId: string;
  className?: string;
}) {
  const { data: documentsData } = useFetchDocuments({ limit: 500, topicId });

  const siblings = (documentsData?.Items ?? [])
    .filter(
      (d) =>
        d.Id !== document.Id &&
        (d.FolderId ?? null) === (document.FolderId ?? null),
    )
    .slice(0, 6);

  return (
    <aside className={cn("p-3", libraryCardClassName, className)}>
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        In this folder ({siblings.length})
      </p>
      {siblings.length === 0 ? (
        <p className="rounded-md border border-dashed py-3 text-center text-[11px] text-muted-foreground">
          No other files
        </p>
      ) : (
        <div className="space-y-1">
          {siblings.map((doc) => {
            const kind = getDocumentKind(doc.FileType);
            return (
              <Link
                key={doc.Id}
                href={`/library/${topicId}/${doc.Id}`}
                className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-accent/50"
              >
                <div
                  className={cn(
                    "shrink-0 rounded p-1",
                    KIND_META[kind].className,
                  )}
                >
                  <DocumentKindIcon kind={kind} size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{doc.Title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {dayjs(doc.UpdatedAt).format("MMM D")}
                  </p>
                </div>
                <ArrowUpRight className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
