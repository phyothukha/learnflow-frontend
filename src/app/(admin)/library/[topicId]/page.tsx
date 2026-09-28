"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import {
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

type TopicTab = "folders" | "files";

export default function TopicDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ folder?: string; tab?: string }>;
}) {
  const { topicId } = use(params);
  const { folder: folderParam, tab: tabParam } = use(searchParams);
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.DOCUMENTS_VIEW);
  const setActiveTopic = useWorkspaceStore((s) => s.setActiveTopic);

  const activeTab: TopicTab = tabParam === "files" ? "files" : "folders";

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

  const buildHref = (next: { folderId?: string | null; tab?: TopicTab }) => {
    const params = new URLSearchParams();
    const folderId =
      next.folderId !== undefined ? next.folderId : (folderParam ?? null);
    const tab = next.tab ?? activeTab;
    if (folderId) params.set("folder", folderId);
    if (tab === "files") params.set("tab", "files");
    const qs = params.toString();
    return `/library/${topicId}${qs ? `?${qs}` : ""}`;
  };

  const navigateFolder = (folderId: string | null) => {
    setSearch("");
    router.push(buildHref({ folderId }));
  };

  const setTab = (tab: TopicTab) => {
    setSearch("");
    router.push(buildHref({ tab }));
  };

  if (!topicsLoading && !topic) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <FolderOpen className="size-8" />
          <p className="text-sm">This topic could not be found.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/library">Open library</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filesInCurrent = allDocuments.filter(
    (doc) => (doc.FolderId ?? null) === (currentFolder?.Id ?? null),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            {topic ? (
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {topic.Title}
              </h1>
            ) : (
              <Skeleton className="h-8 w-48" />
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {topic?.Description || "Folders and documents in this topic"}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "folders" ? (
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
          ) : (
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
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {(
          [
            {
              value: "folders" as const,
              label: "Folders",
              count: childFolders.length,
            },
            {
              value: "files" as const,
              label: "Files",
              count: filesInCurrent,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTab(tab.value)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              activeTab === tab.value &&
                "border-primary font-medium text-foreground",
            )}
          >
            {tab.label}
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "folders" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2">
            <FolderBreadcrumb path={path} onNavigate={navigateFolder} />
          </div>

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
                  onOpen={() => navigateFolder(node.Id)}
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
                      navigateFolder(currentFolder?.ParentFolderId ?? null);
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
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <FolderSidebar
            tree={tree}
            currentPath={path}
            totalFiles={allDocuments.length}
            countByFolder={countByFolder}
            onNavigate={navigateFolder}
            onCreate={(parentFolderId) =>
              setFolderDialog({ type: "create", parentFolderId })
            }
            className="lg:sticky lg:top-18"
          />
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2">
              <FolderBreadcrumb path={path} onNavigate={navigateFolder} />
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files…"
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

            <section className={cn("overflow-hidden", libraryCardClassName)}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
                <SectionTitle
                  title={
                    isSearching ? `Results for “${search.trim()}”` : "Files"
                  }
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

              <div className="mt-4 flex gap-1 overflow-x-auto border-b px-5">
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

              <div className="bg-muted/20 p-5">
                {documentsLoading ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-56 rounded-xl" />
                    ))}
                  </div>
                ) : files.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card py-16 text-center text-muted-foreground">
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
                  <div className="grid gap-5 md:grid-cols-2">
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
      )}

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
        "group flex min-h-[220px] flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(15,23,42,0.1)]",
        libraryCardClassName,
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("shrink-0 rounded-xl p-3", meta.className)}>
          <DocumentKindIcon kind={kind} size={28} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-2 text-base leading-snug font-semibold">
            {document.Title}
          </p>
          <p className="text-xs text-muted-foreground">
            {meta.label} · {getExtensionLabel(document.FileType)}
          </p>
        </div>
        <DocumentActions
          document={document}
          onSettings={onSettings}
          className="-mt-1 -mr-1 shrink-0"
        />
      </div>

      <dl className="space-y-2.5 rounded-xl border bg-muted/40 p-4 text-sm">
        <div className="flex items-center">
          <dt className="flex w-24 items-center gap-1.5 text-muted-foreground">
            <FileType className="size-4" />
            Type
          </dt>
          <dd className="font-medium">
            {meta.label}
            <span className="ml-1.5 rounded border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {getExtensionLabel(document.FileType)}
            </span>
          </dd>
        </div>
        <div className="flex items-center">
          <dt className="flex w-24 items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-4" />
            Updated
          </dt>
          <dd className="font-medium">
            {dayjs(document.UpdatedAt).format("MMM D, YYYY")}
          </dd>
        </div>
        <div className="flex items-center">
          <dt className="flex w-24 items-center gap-1.5 text-muted-foreground">
            <CircleDashed className="size-4" />
            Status
          </dt>
          <dd>
            <DocumentStatusPill status={document.Status} />
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {document.Tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-6 max-w-28 truncate px-2 text-[11px]"
            >
              {tag}
            </Badge>
          ))}
          {document.Tags.length > 2 && (
            <span className="text-[11px] leading-6 text-muted-foreground">
              +{document.Tags.length - 2}
            </span>
          )}
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}
