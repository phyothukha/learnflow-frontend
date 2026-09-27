"use client";

import { Fragment, use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Clock,
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
  NotebookPen,
  PanelLeft,
  Paperclip,
  PenLine,
  Plus,
  Settings2,
  Table2,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Input } from "@/components/ui/input";
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
import { useFetchNotes } from "@/store/server/notes/queries";
import { useCreateNote } from "@/store/server/notes/mutations";
import { DocumentDetailDialog } from "../../components/document-detail-dialog";
import { findFolderPath } from "../../components/folder-explorer";
import { libraryCardClassName } from "../../components/library-card";
import {
  CsvTable,
  csvStats,
  DocumentOutline,
  downloadText,
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

const STATUS_STYLE: Record<DocumentStatus, string> = {
  Unread: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  InProgress: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

type ViewMode = "preview" | "normal";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[70vh] rounded-xl" />
        <Skeleton className="hidden h-[70vh] rounded-xl lg:block" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <FileText className="size-8" />
          <p className="text-sm">This document could not be found.</p>
          <Button variant="outline" size="sm" asChild>
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

  const guardLeave = (e: React.MouseEvent) => {
    if (dirtyRef.current && !window.confirm("Discard unsaved changes?"))
      e.preventDefault();
  };

  const handleDownload = () => {
    if (isTextKind) {
      downloadText(
        content,
        `${document.Title}.${kind === "csv" ? "csv" : "md"}`,
        kind === "csv" ? "text/csv" : "text/markdown",
      );
    } else if (document.FileUrl) {
      window.open(document.FileUrl, "_blank", "noopener");
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
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/library" onClick={guardLeave}>
                Library
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={topicHref}
                onClick={guardLeave}
                className="inline-flex items-center gap-1.5"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: topicColor }}
                />
                {topic?.Title ?? "Topic"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {folderPath.map((folder) => (
            <Fragment key={folder.Id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href={`${topicHref}?folder=${folder.Id}`}
                    onClick={guardLeave}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Folder className="size-3.5" />
                    {folder.Name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Fragment>
          ))}
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">
              {document.Title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div
        className={cn(
          "grid items-start gap-4",
          showRelated && "lg:grid-cols-[minmax(0,1fr)_320px]",
        )}
      >
        <main className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {viewTabs}
            <div className="flex items-center gap-2">
              {kind === "markdown" && !editing && (
                <Button size="sm" onClick={() => setEditing(true)}>
                  <PenLine className="size-4" />
                  Edit document
                </Button>
              )}
              {isTextKind && (
                <Button
                  variant="outline"
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
                variant="outline"
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
                isTextKind &&
                "flex h-[calc(100svh-12rem)] min-h-[420px] flex-col",
            )}
          >
            <div
              className={cn(
                "flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3",
                fullscreen && "shrink-0 bg-card px-6",
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
                      variant={showOutline ? "secondary" : "outline"}
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
                <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                  <Calendar className="size-3.5" />
                  {dayjs(document.UpdatedAt).format("MMM D, YYYY")}
                </span>
                {isTextKind && content && !editing && (
                  <Button
                    variant="outline"
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
                    <Button variant="outline" size="icon" className="size-7">
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
                    variant={fullscreen ? "default" : "outline"}
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
          <div className="min-w-0 space-y-4">
            <InfoPanel
              document={document}
              topicTitle={topic?.Title}
              topicColor={topicColor}
              folderPath={folderPath.map((f) => f.Name)}
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
    </div>
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
            <Button variant="outline" size="sm" onClick={onEdit}>
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
      className="group flex flex-col items-center gap-1.5 disabled:pointer-events-none disabled:opacity-40"
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full border bg-background transition-colors group-hover:bg-accent",
          destructive &&
            "group-hover:border-destructive/40 group-hover:text-destructive",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function InfoPanel({
  document,
  topicTitle,
  topicColor,
  folderPath,
  canEdit,
  canDownload,
  onEdit,
  onDownload,
  onSettings,
  onDelete,
}: {
  document: StudyDocument;
  topicTitle?: string;
  topicColor: string;
  folderPath: string[];
  canEdit: boolean;
  canDownload: boolean;
  onEdit: () => void;
  onDownload: () => void;
  onSettings: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<"about" | "attachments">("about");
  const updateDocument = useUpdateDocument();
  const kind = getDocumentKind(document.FileType);
  const meta = KIND_META[kind];

  const setStatus = (value: string) =>
    updateDocument.mutate({
      id: document.Id,
      payload: { Status: value as DocumentStatus },
    });

  return (
    <aside className={libraryCardClassName}>
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Details
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Actions
              <ChevronDown className="size-3.5" />
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

      <div className="flex items-center gap-3 px-4 pt-5">
        <div className={cn("shrink-0 rounded-2xl p-3.5", meta.className)}>
          <DocumentKindIcon kind={kind} size={28} />
        </div>
        <div className="min-w-0">
          <h1 className="line-clamp-2 text-base leading-snug font-semibold">
            {document.Title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {meta.label} · {getExtensionLabel(document.FileType)}
          </p>
          <span
            className={cn(
              "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              STATUS_STYLE[document.Status],
            )}
          >
            {STATUS_LABEL[document.Status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 pt-5">
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

      <div className="mt-5 flex border-b px-4">
        {(
          [
            ["about", "About document"],
            ["attachments", `Attachments (${document.Attachments.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px flex-1 border-b-2 border-transparent py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              tab === value && "border-primary font-medium text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "about" ? (
        <div className="space-y-4 p-4">
          <Field label="Topic">
            <span className="inline-flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: topicColor }}
              />
              {topicTitle ?? "—"}
            </span>
          </Field>
          <Field label="Folder">
            <span className="inline-flex items-center gap-1.5">
              <Folder className="size-3.5 text-muted-foreground" />
              {folderPath.length ? folderPath.join(" / ") : "Top level"}
            </span>
          </Field>
          <Field label="Tags">
            {document.Tags.length ? (
              <div className="flex flex-wrap gap-1">
                {document.Tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              "—"
            )}
          </Field>
          <Field label="Time spent">
            {formatMinutes(document.TimeSpentMinutes)}
          </Field>
          <Field label="Last opened">
            {document.LastOpenedAt
              ? dayjs(document.LastOpenedAt).format("MMM D, YYYY HH:mm")
              : "—"}
          </Field>
          <Field label="Created">
            {dayjs(document.CreatedAt).format("MMM D, YYYY HH:mm")}
          </Field>
          <Field label="Last updated">
            {dayjs(document.UpdatedAt).format("MMM D, YYYY HH:mm")}
          </Field>
          {document.FileUrl && (
            <Field label="Source">
              <a
                href={document.FileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1 text-primary hover:underline"
              >
                <span className="truncate">{document.FileUrl}</span>
                <ArrowUpRight className="size-3.5 shrink-0" />
              </a>
            </Field>
          )}
        </div>
      ) : (
        <AttachmentsTab document={document} />
      )}
    </aside>
  );
}

function AttachmentsTab({ document }: { document: StudyDocument }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  return (
    <div className="space-y-2 p-4">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploadAttachment.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="size-4" />
        {uploadAttachment.isPending ? "Uploading…" : "Upload attachment"}
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
        <p className="py-6 text-center text-xs text-muted-foreground">
          No attachments yet.
        </p>
      ) : (
        document.Attachments.map((attachment) => (
          <div
            key={attachment.Id}
            className="group flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
          >
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{attachment.FileName}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatSize(attachment.SizeBytes)}
              </p>
            </div>
            <a
              href={attachment.Url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Download className="size-3.5" />
            </a>
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

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && children}
    </section>
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
  const router = useRouter();
  const [noteTitle, setNoteTitle] = useState("");
  const { data: notesData } = useFetchNotes({
    documentId: document.Id,
    limit: 50,
  });
  const { data: documentsData } = useFetchDocuments({ limit: 500, topicId });
  const createNote = useCreateNote();

  const notes = notesData?.Items ?? [];
  const siblings = (documentsData?.Items ?? [])
    .filter(
      (d) =>
        d.Id !== document.Id &&
        (d.FolderId ?? null) === (document.FolderId ?? null),
    )
    .slice(0, 6);

  const addNote = () => {
    if (!noteTitle.trim()) return;
    createNote.mutate(
      { TopicId: topicId, DocumentId: document.Id, Title: noteTitle.trim() },
      {
        onSuccess: (note) => {
          setNoteTitle("");
          toast.success("Note added");
          router.push(`/notes/${note.Id}`);
        },
        onError: () => toast.error("Failed to add note"),
      },
    );
  };

  return (
    <aside className={cn("space-y-6 p-4", libraryCardClassName, className)}>
      <CollapsibleSection title="Notes" count={notes.length}>
        <div className="flex gap-2">
          <Input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder="Add a quick note…"
            className="h-8"
          />
          <Button
            size="icon"
            className="size-8 shrink-0"
            onClick={addNote}
            disabled={createNote.isPending}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {notes.length === 0 ? (
          <p className="rounded-lg border border-dashed py-5 text-center text-xs text-muted-foreground">
            No notes linked to this document.
          </p>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Link
                key={note.Id}
                href={`/notes/${note.Id}`}
                className="block rounded-lg border p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-start gap-2">
                  <NotebookPen className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{note.Title}</p>
                    {note.Content && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {note.Content.replace(/[#*_>`[\]()-]/g, "").trim()}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {dayjs(note.UpdatedAt).format("MMM D, HH:mm")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            <Link
              href="/notes"
              className="block text-center text-xs font-medium text-primary hover:underline"
            >
              Open in Notes
            </Link>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="In this folder" count={siblings.length}>
        {siblings.length === 0 ? (
          <p className="rounded-lg border border-dashed py-5 text-center text-xs text-muted-foreground">
            No other files here.
          </p>
        ) : (
          <div className="space-y-2">
            {siblings.map((doc) => {
              const kind = getDocumentKind(doc.FileType);
              return (
                <Link
                  key={doc.Id}
                  href={`/library/${topicId}/${doc.Id}`}
                  className="group block rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-medium">
                      {doc.Title}
                    </p>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  </div>
                  <dl className="mt-2 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <dt className="flex w-20 items-center gap-1.5 text-muted-foreground">
                        <DocumentKindIcon kind={kind} size={14} />
                        Type
                      </dt>
                      <dd>{KIND_META[kind].label}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="flex w-20 items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5" />
                        Updated
                      </dt>
                      <dd>{dayjs(doc.UpdatedAt).format("MMM D, YYYY")}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="flex w-20 items-center gap-1.5 text-muted-foreground">
                        <Tag className="size-3.5" />
                        Status
                      </dt>
                      <dd>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px] font-medium",
                            STATUS_STYLE[doc.Status],
                          )}
                        >
                          {STATUS_LABEL[doc.Status]}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </Link>
              );
            })}
          </div>
        )}
      </CollapsibleSection>
    </aside>
  );
}
