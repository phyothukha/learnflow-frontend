"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  CircleDashed,
  FileSearch,
  FileType,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
  Search,
  Tag,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  type DocumentKind,
  getDocumentKind,
  getExtensionLabel,
  KIND_META,
} from "@/lib/document-types";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchTopics } from "@/store/server/topics/queries";
import { useFetchDocuments } from "@/store/server/documents/queries";
import type { StudyDocument } from "@/store/server/documents/interface";
import { useFetchFolderTree } from "@/store/server/topic-folders/queries";
import { CreateDocumentDialog } from "../components/create-document-dialog";
import { DocumentDetailDialog } from "../components/document-detail-dialog";
import {
  DocumentActions,
  DocumentStatusPill,
} from "../components/documents-columns";
import { DocumentsTable } from "../components/documents-table";
import { libraryCardClassName } from "../components/library-card";
import {
  collectFolderIds,
  findFolderPath,
  flattenFolders,
  FolderBreadcrumb,
  FolderSidebar,
  FolderCard,
  type FolderDialogState,
  FolderNameDialog,
  NewFolderCard,
} from "../components/folder-explorer";

const KIND_FILTERS: DocumentKind[] = [
  "markdown",
  "pdf",
  "word",
  "powerpoint",
  "csv",
  "link",
];

export default function TopicDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { topicId } = use(params);
  const { folder: folderParam } = use(searchParams);
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.DOCUMENTS_VIEW);
  const setActiveTopic = useWorkspaceStore((s) => s.setActiveTopic);

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeKind, setActiveKind] = useState<DocumentKind | null>(null);
  const [search, setSearch] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [folderDialog, setFolderDialog] = useState<FolderDialogState | null>(
    null,
  );
  const [settingsDocument, setSettingsDocument] =
    useState<StudyDocument | null>(null);

  const { data: topicsData, isLoading: topicsLoading } = useFetchTopics({
    limit: 100,
  });
  const { data: folderTree, isLoading: foldersLoading } =
    useFetchFolderTree(topicId);
  const { data: documentsData, isLoading: documentsLoading } =
    useFetchDocuments({ limit: 500, topicId });

  useEffect(() => {
    if (status === "authenticated" && !canView) router.replace("/forbidden");
  }, [status, canView, router]);

  useEffect(() => {
    setActiveTopic(topicId);
  }, [topicId, setActiveTopic]);

  const tree = useMemo(() => folderTree ?? [], [folderTree]);
  const allDocuments = useMemo(
    () => documentsData?.Items ?? [],
    [documentsData],
  );

  const path = useMemo(
    () => (folderParam ? (findFolderPath(tree, folderParam) ?? []) : []),
    [tree, folderParam],
  );
  const currentFolder = path[path.length - 1] ?? null;
  const childFolders = currentFolder ? currentFolder.Children : tree;

  const countByFolder = useMemo(() => {
    const direct = new Map<string, number>();
    for (const doc of allDocuments) {
      if (doc.FolderId)
        direct.set(doc.FolderId, (direct.get(doc.FolderId) ?? 0) + 1);
    }
    const totals = new Map<string, number>();
    for (const { node } of flattenFolders(tree)) {
      totals.set(
        node.Id,
        collectFolderIds(node).reduce(
          (sum, id) => sum + (direct.get(id) ?? 0),
          0,
        ),
      );
    }
    return totals;
  }, [allDocuments, tree]);

  if (status !== "authenticated" || !canView) return null;

  const topic = topicsData?.Items.find((t) => t.Id === topicId);
  const color = topic?.Color ?? FALLBACK_TOPIC_COLOR;
  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;
  const usedTags = Array.from(
    new Set(allDocuments.flatMap((doc) => doc.Tags)),
  ).sort();

  const scopedFiles = allDocuments.filter(
    (doc) =>
      (isSearching
        ? doc.Title.toLowerCase().includes(query)
        : (doc.FolderId ?? null) === (currentFolder?.Id ?? null)) &&
      (!activeTag || doc.Tags.includes(activeTag)),
  );
  const kindCounts: Partial<Record<DocumentKind, number>> & { total: number } =
    { total: scopedFiles.length };
  for (const doc of scopedFiles) {
    const kind = getDocumentKind(doc.FileType);
    kindCounts[kind] = (kindCounts[kind] ?? 0) + 1;
  }
  const files = activeKind
    ? scopedFiles.filter((doc) => getDocumentKind(doc.FileType) === activeKind)
    : scopedFiles;

  const navigate = (folderId: string | null) => {
    setSearch("");
    router.push(
      folderId
        ? `/library/${topicId}?folder=${folderId}`
        : `/library/${topicId}`,
    );
  };

  if (!topicsLoading && !topic) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <FolderOpen className="size-8" />
          <p className="text-sm">This topic could not be found.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/library">Back to library</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 px-2 text-muted-foreground"
          asChild
        >
          <Link href="/library">
            <ArrowLeft className="size-4" />
            Library
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              {topic?.Title.charAt(0).toUpperCase() ?? "·"}
            </div>
            <div className="min-w-0">
              {topic ? (
                <>
                  <h1 className="truncate text-2xl font-semibold">
                    {topic.Title}
                  </h1>
                  <p className="truncate text-sm text-muted-foreground">
                    {topic.Description || "Documents in this topic"}
                  </p>
                </>
              ) : (
                <Skeleton className="h-8 w-48" />
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFolderDialog({
                  type: "create",
                  parentFolderId: currentFolder?.Id ?? null,
                })
              }
            >
              <FolderPlus className="size-4" />
              New folder
            </Button>
            <CreateDocumentDialog
              topicId={topicId}
              defaultFolderId={currentFolder?.Id ?? null}
              folderOptions={flattenFolders(tree).map(({ node, depth }) => ({
                id: node.Id,
                label: `${"— ".repeat(depth)}${node.Name}`,
              }))}
              onCreated={(doc, mode) =>
                router.push(
                  `/library/${topicId}/${doc.Id}${mode === "write" ? "?edit=1" : ""}`,
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <FolderSidebar
          tree={tree}
          currentPath={path}
          totalFiles={allDocuments.length}
          countByFolder={countByFolder}
          onNavigate={navigate}
          onCreate={(parentFolderId) =>
            setFolderDialog({ type: "create", parentFolderId })
          }
          className="lg:sticky lg:top-18"
        />
        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2">
            <FolderBreadcrumb path={path} onNavigate={navigate} />
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in this topic…"
                className="h-8 w-64 bg-background pr-8 pl-8"
              />
              {isSearching && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {!isSearching && (
            <section className="space-y-3">
              <SectionTitle
                title="Folders"
                count={foldersLoading ? undefined : childFolders.length}
              />
              {foldersLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[116px] rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {childFolders.map((node) => (
                    <FolderCard
                      key={node.Id}
                      node={node}
                      fileCount={countByFolder.get(node.Id) ?? 0}
                      onOpen={() => navigate(node.Id)}
                      onAddSubfolder={() =>
                        setFolderDialog({
                          type: "create",
                          parentFolderId: node.Id,
                        })
                      }
                      onRename={() =>
                        setFolderDialog({ type: "rename", folder: node })
                      }
                      onDeleted={() => {
                        if (path.some((p) => p.Id === node.Id))
                          navigate(currentFolder?.ParentFolderId ?? null);
                      }}
                    />
                  ))}
                  <NewFolderCard
                    onClick={() =>
                      setFolderDialog({
                        type: "create",
                        parentFolderId: currentFolder?.Id ?? null,
                      })
                    }
                  />
                </div>
              )}
            </section>
          )}

          <section className={cn("overflow-hidden", libraryCardClassName)}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
              <SectionTitle
                title={isSearching ? `Results for “${search.trim()}”` : "Files"}
                count={documentsLoading ? undefined : files.length}
              />
              <div className="flex items-center gap-2">
                {usedTags.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={activeTag ? "default" : "outline"}
                        size="sm"
                        className="h-8"
                      >
                        <Tag className="size-3.5" />
                        {activeTag ?? "All tags"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="max-h-72 w-48 overflow-y-auto"
                    >
                      <DropdownMenuItem onClick={() => setActiveTag(null)}>
                        <Check
                          className={cn(
                            !activeTag ? "opacity-100" : "opacity-0",
                          )}
                        />
                        All tags
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {usedTags.map((tag) => (
                        <DropdownMenuItem
                          key={tag}
                          onClick={() => setActiveTag(tag)}
                        >
                          <Check
                            className={cn(
                              activeTag === tag ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {tag}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5">
                  {(
                    [
                      ["grid", LayoutGrid, "Grid view"],
                      ["list", List, "List view"],
                    ] as const
                  ).map(([value, Icon, label]) => (
                    <button
                      key={value}
                      type="button"
                      title={label}
                      onClick={() => setLayout(value)}
                      className={cn(
                        "rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground",
                        layout === value &&
                          "bg-background text-foreground shadow-xs",
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-1 overflow-x-auto border-b px-4">
              <KindTab
                active={activeKind === null}
                onClick={() => setActiveKind(null)}
                count={kindCounts.total}
              >
                All
              </KindTab>
              {KIND_FILTERS.map((kind) => (
                <KindTab
                  key={kind}
                  active={activeKind === kind}
                  onClick={() =>
                    setActiveKind(activeKind === kind ? null : kind)
                  }
                  count={kindCounts[kind] ?? 0}
                >
                  <DocumentKindIcon kind={kind} size={16} />
                  {KIND_META[kind].label}
                </KindTab>
              ))}
            </div>

            <div className="bg-muted/20 p-4">
              {documentsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-44 rounded-xl" />
                  ))}
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card py-14 text-center text-muted-foreground">
                  {isSearching ? (
                    <FileSearch className="size-8" />
                  ) : (
                    <FolderOpen className="size-8" />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {isSearching || activeKind || activeTag
                      ? "No matching files"
                      : "No files here yet"}
                  </p>
                  <p className="text-xs">
                    {isSearching || activeKind || activeTag
                      ? "Try a different search or clear the filters."
                      : "Write a Markdown page or upload a PDF, Word, PowerPoint or CSV file."}
                  </p>
                </div>
              ) : layout === "grid" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {files.map((doc) => (
                    <DocumentCard
                      key={doc.Id}
                      document={doc}
                      href={`/library/${topicId}/${doc.Id}`}
                      onSettings={() => setSettingsDocument(doc)}
                    />
                  ))}
                </div>
              ) : (
                <DocumentsTable
                  documents={files}
                  topicId={topicId}
                  onSettings={setSettingsDocument}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      {folderDialog && (
        <FolderNameDialog
          topicId={topicId}
          state={folderDialog}
          onClose={() => setFolderDialog(null)}
        />
      )}
      {settingsDocument && (
        <DocumentDetailDialog
          document={settingsDocument}
          onClose={() => setSettingsDocument(null)}
        />
      )}
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold">
      {title}
      {count !== undefined && (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </h2>
  );
}

function KindTab({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
        active && "border-primary font-medium text-foreground",
      )}
    >
      {children}
      {count > 0 && (
        <span className="text-[11px] text-muted-foreground">{count}</span>
      )}
    </button>
  );
}

function DocumentCard({
  document,
  href,
  onSettings,
}: {
  document: StudyDocument;
  href: string;
  onSettings: () => void;
}) {
  const kind = getDocumentKind(document.FileType);
  const meta = KIND_META[kind];

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(15,23,42,0.1)]",
        libraryCardClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("shrink-0 rounded-lg p-2", meta.className)}>
          <DocumentKindIcon kind={kind} size={20} />
        </div>
        <p className="line-clamp-2 min-w-0 flex-1 pt-0.5 text-sm leading-snug font-semibold">
          {document.Title}
        </p>
        <DocumentActions
          document={document}
          onSettings={onSettings}
          className="-mt-1 -mr-1 shrink-0"
        />
      </div>

      <dl className="space-y-2 rounded-lg border bg-muted/40 p-3 text-xs">
        <div className="flex items-center">
          <dt className="flex w-20 items-center gap-1.5 text-muted-foreground">
            <FileType className="size-3.5" />
            Type
          </dt>
          <dd className="font-medium">
            {meta.label}
            <span className="ml-1.5 rounded border bg-background px-1 py-px text-[10px] text-muted-foreground">
              {getExtensionLabel(document.FileType)}
            </span>
          </dd>
        </div>
        <div className="flex items-center">
          <dt className="flex w-20 items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5" />
            Updated
          </dt>
          <dd className="font-medium">
            {dayjs(document.UpdatedAt).format("MMM D, YYYY")}
          </dd>
        </div>
        <div className="flex items-center">
          <dt className="flex w-20 items-center gap-1.5 text-muted-foreground">
            <CircleDashed className="size-3.5" />
            Status
          </dt>
          <dd>
            <DocumentStatusPill status={document.Status} />
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1">
          {document.Tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-5 max-w-24 truncate px-1.5 text-[10px]"
            >
              {tag}
            </Badge>
          ))}
          {document.Tags.length > 2 && (
            <span className="text-[10px] leading-5 text-muted-foreground">
              +{document.Tags.length - 2}
            </span>
          )}
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}
