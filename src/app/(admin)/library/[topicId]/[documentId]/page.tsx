"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  DocumentKind,
  getDocumentKind,
  getExtensionLabel,
} from "@/lib/document-types";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { cn } from "@/lib/utils";
import { FALLBACK_TOPIC_COLOR } from "@/utils/colors";
import { downloadFromUrl, downloadText } from "@/utils/file";
import { findFolderPath } from "@/utils/folder";
import { useDeleteDocument } from "@/store/server/documents/mutations";
import { useFetchDocument } from "@/store/server/documents/queries";
import { useFetchFolderTree } from "@/store/server/topic-folders/queries";
import { useFetchTopics } from "@/store/server/topics/queries";
import { DocumentDetailDialog } from "../../components/document-detail-dialog";
import {
  DocumentOutline,
  extractHeadings,
  MarkdownEditorPanel,
} from "../../components/document-viewers";
import { DocumentBody } from "./components/document-body";
import { DocumentHeader } from "./components/document-header";
import { DocumentInfoPanel } from "./components/document-info-panel";
import { DocumentRelatedPanel } from "./components/document-related-panel";
import { DocumentToolbar } from "./components/document-toolbar";
import { ViewMode } from "./components/document-view-tabs";

interface DocumentViewerPageParams {
  topicId: string;
  documentId: string;
}

interface DocumentViewerPageSearchParams {
  edit?: string;
}

interface DocumentViewerPageProps {
  params: Promise<DocumentViewerPageParams>;
  searchParams: Promise<DocumentViewerPageSearchParams>;
}

export default function DocumentViewerPage({
  params,
  searchParams,
}: DocumentViewerPageProps) {
  const { topicId, documentId } = use(params);
  const { edit } = use(searchParams);
  const router = useRouter();
  const canView = useRequirePermission(PERMISSIONS.DOCUMENTS_VIEW);

  const [view, setView] = useState<ViewMode>(ViewMode.Preview);
  const [editing, setEditing] = useState(edit === "1");
  const [showRelated, setShowRelated] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
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
  const { confirmDelete, dialogProps } = useConfirmDialog();

  const topicHref = `/library/${topicId}`;
  const topic = topicsData?.Items.find((t) => t.Id === topicId);

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

  if (!canView) return null;

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
  const isTextKind =
    kind === DocumentKind.Markdown || kind === DocumentKind.Csv;
  const content = document.Content ?? "";
  const folderPath = document.FolderId
    ? (findFolderPath(folderTree ?? [], document.FolderId) ?? [])
    : [];
  const fileName = `${document.Title}.${getExtensionLabel(document.FileType).toLowerCase()}`;
  const canDownload =
    isTextKind || (!!document.FileUrl && kind !== DocumentKind.Link);
  const scrollBody = fullscreen || isTextKind;
  const showOutlinePanel =
    fullscreen &&
    showOutline &&
    kind === DocumentKind.Markdown &&
    view === ViewMode.Preview &&
    !editing &&
    !!content.trim();

  const startEditing = () => setEditing(true);
  const openSettings = () => setShowSettings(true);

  const handleDownload = () => {
    const ext =
      kind === DocumentKind.Csv
        ? "csv"
        : kind === DocumentKind.Markdown
          ? "md"
          : getExtensionLabel(document.FileType).toLowerCase();
    const downloadName = `${document.Title}.${ext}`;
    if (isTextKind) {
      downloadText(
        content,
        downloadName,
        kind === DocumentKind.Csv ? "text/csv" : "text/markdown",
      );
    } else if (document.FileUrl) {
      downloadFromUrl(document.FileUrl, downloadName);
    }
  };

  const handleDelete = () =>
    confirmDelete({
      itemName: document.Title,
      successMessage: "Document deleted",
      errorMessage: "Failed to delete document",
      onConfirm: async () => {
        await deleteDocument.mutateAsync(document.Id);
        dirtyRef.current = false;
        router.push(topicHref);
      },
    });

  return (
    <>
      <div
        className={cn(
          "grid items-start gap-3",
          showRelated && "lg:grid-cols-[minmax(0,1fr)_220px]",
        )}
      >
        <main className="min-w-0 space-y-3">
          <DocumentHeader
            document={document}
            kind={kind}
            topicTitle={topic?.Title}
            topicColor={topic?.Color ?? FALLBACK_TOPIC_COLOR}
            folderLabel={
              folderPath.length
                ? folderPath.map((f) => f.Name).join(" / ")
                : "Top level"
            }
            view={view}
            editing={editing}
            showRelated={showRelated}
            onViewChange={setView}
            onEdit={startEditing}
            onFullscreen={() => setFullscreen(true)}
            onToggleRelated={() => setShowRelated((v) => !v)}
          />

          <div
            className={cn(
              "overflow-hidden bg-card",
              fullscreen
                ? "fixed inset-0 z-50 flex flex-col bg-background"
                : "library-card flex h-[calc(100svh-7.5rem)] min-h-[480px] flex-col",
            )}
          >
            <DocumentToolbar
              document={document}
              kind={kind}
              fileName={fileName}
              view={view}
              editing={editing}
              fullscreen={fullscreen}
              showOutline={showOutline}
              canDownload={canDownload}
              onViewChange={setView}
              onEdit={startEditing}
              onToggleOutline={() => setShowOutline((v) => !v)}
              onToggleFullscreen={() => setFullscreen((v) => !v)}
              onDownload={handleDownload}
              onSettings={openSettings}
            />

            <div className={cn(scrollBody && "flex min-h-0 flex-1")}>
              {showOutlinePanel && (
                <DocumentOutline
                  headings={extractHeadings(content)}
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
                    onEdit={startEditing}
                  />
                )}
              </div>
            </div>
          </div>
        </main>

        {showRelated && (
          <div className="min-w-0 space-y-3 lg:sticky lg:top-18">
            <DocumentInfoPanel
              document={document}
              canEdit={kind === DocumentKind.Markdown}
              canDownload={canDownload}
              onEdit={startEditing}
              onDownload={handleDownload}
              onSettings={openSettings}
              onDelete={handleDelete}
            />
            <DocumentRelatedPanel document={document} topicId={topicId} />
          </div>
        )}
      </div>

      {showSettings && (
        <DocumentDetailDialog
          document={document}
          onClose={() => setShowSettings(false)}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
