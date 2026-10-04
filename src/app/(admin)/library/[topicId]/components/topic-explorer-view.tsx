"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedTabs, AnimatedTabsVariant } from "@/components/animated-tabs";
import { DocumentKindIcon } from "@/components/document-kind-icon";
import {
  DocumentKind,
  getDocumentKind,
  getKindMeta,
} from "@/lib/document-types";
import type { StudyDocument } from "@/store/server/documents/interface";
import type { TopicFolderTreeNode } from "@/store/server/topic-folders/interface";
import { DocumentsTable } from "../../components/documents-table";
import {
  FolderBreadcrumb,
  FolderCard,
  FolderSidebar,
  NewFolderCard,
} from "../../components/folder-explorer";
import { DocumentCard } from "./document-card";
import { FilesEmptyState } from "./files-empty-state";
import { TagFilter } from "./tag-filter";

const KIND_FILTERS: DocumentKind[] = [
  DocumentKind.Markdown,
  DocumentKind.Pdf,
  DocumentKind.Word,
  DocumentKind.PowerPoint,
  DocumentKind.Csv,
  DocumentKind.Link,
];

const ALL_KINDS = "all";

enum LayoutMode {
  Grid = "grid",
  List = "list",
}

interface TopicExplorerViewProps {
  documents: StudyDocument[];
  tree: TopicFolderTreeNode[];
  path: TopicFolderTreeNode[];
  folders: TopicFolderTreeNode[];
  countByFolder: Map<string, number>;
  isLoading: boolean;
  onNavigate: (folderId: string | null) => void;
  onCreateFolder: (parentFolderId: string | null) => void;
  onRenameFolder: (folder: TopicFolderTreeNode) => void;
}

export function TopicExplorerView({
  documents,
  tree,
  path,
  folders,
  countByFolder,
  isLoading,
  onNavigate,
  onCreateFolder,
  onRenameFolder,
}: TopicExplorerViewProps) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeKind, setActiveKind] = useState<DocumentKind | null>(null);
  const [layout, setLayout] = useState<LayoutMode>(LayoutMode.Grid);

  const currentFolder = path[path.length - 1] ?? null;
  const currentFolderId = currentFolder?.Id ?? null;
  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;
  const usedTags = Array.from(
    new Set(documents.flatMap((doc) => doc.Tags)),
  ).sort();

  const visibleFolders = isSearching
    ? folders.filter((folder) => folder.Name.toLowerCase().includes(query))
    : folders;

  const scopedFiles = documents.filter(
    (doc) =>
      (isSearching
        ? doc.Title.toLowerCase().includes(query)
        : (doc.FolderId ?? null) === currentFolderId) &&
      (!activeTag || doc.Tags.includes(activeTag)),
  );
  const kindCounts = new Map<DocumentKind, number>();
  for (const doc of scopedFiles) {
    const kind = getDocumentKind(doc.FileType);
    kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1);
  }
  const files = activeKind
    ? scopedFiles.filter((doc) => getDocumentKind(doc.FileType) === activeKind)
    : scopedFiles;

  const navigate = (folderId: string | null) => {
    setSearch("");
    onNavigate(folderId);
  };

  const isEmpty =
    !isLoading && visibleFolders.length === 0 && files.length === 0;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
      <FolderSidebar
        tree={tree}
        currentPath={path}
        totalFiles={documents.length}
        countByFolder={countByFolder}
        onNavigate={navigate}
        onCreate={onCreateFolder}
        className="lg:sticky lg:top-18"
      />
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 rounded-xl border bg-muted/30 px-3 py-2">
            <FolderBreadcrumb path={path} onNavigate={navigate} />
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search folders and files…"
            className="sm:w-64"
          />
        </div>

        {!isSearching && !isLoading ? (
          <div className="library-grid">
            {visibleFolders.map((node) => (
              <FolderCard
                key={node.Id}
                node={node}
                fileCount={countByFolder.get(node.Id) ?? 0}
                onOpen={() => navigate(node.Id)}
                onAddSubfolder={() => onCreateFolder(node.Id)}
                onRename={() => onRenameFolder(node)}
                onDeleted={() => {
                  if (path.some((p) => p.Id === node.Id))
                    onNavigate(currentFolder?.ParentFolderId ?? null);
                }}
              />
            ))}
            <NewFolderCard onClick={() => onCreateFolder(currentFolderId)} />
          </div>
        ) : null}

        {isSearching && visibleFolders.length > 0 ? (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Folders
            </h2>
            <div className="library-grid">
              {visibleFolders.map((node) => (
                <FolderCard
                  key={node.Id}
                  node={node}
                  fileCount={countByFolder.get(node.Id) ?? 0}
                  onOpen={() => navigate(node.Id)}
                  onAddSubfolder={() => onCreateFolder(node.Id)}
                  onRename={() => onRenameFolder(node)}
                  onDeleted={() => {
                    if (path.some((p) => p.Id === node.Id))
                      onNavigate(currentFolder?.ParentFolderId ?? null);
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}

        <section className="library-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              {isSearching ? `Files matching “${search.trim()}”` : "Files"}
              {!isLoading && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {files.length}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <TagFilter
                tags={usedTags}
                value={activeTag}
                onChange={setActiveTag}
              />
              <AnimatedTabs
                variant={AnimatedTabsVariant.Pill}
                value={layout}
                onValueChange={setLayout}
                className="bg-muted/40 p-0.5 shadow-none"
                tabClassName="p-1.5"
                indicatorClassName="bg-background"
                tabs={[
                  {
                    value: LayoutMode.Grid,
                    title: "Grid view",
                    label: <LayoutGrid className="size-4" />,
                  },
                  {
                    value: LayoutMode.List,
                    title: "List view",
                    label: <List className="size-4" />,
                  },
                ]}
              />
            </div>
          </div>

          <AnimatedTabs
            value={activeKind ?? ALL_KINDS}
            onValueChange={(next) =>
              setActiveKind(next === ALL_KINDS ? null : next)
            }
            className="scrollbar-handle mt-4 overflow-x-auto px-5"
            tabClassName="gap-1.5 px-3"
            tabs={[
              { value: ALL_KINDS, label: "All", count: scopedFiles.length },
              ...KIND_FILTERS.map((kind) => ({
                value: kind,
                label: (
                  <>
                    <DocumentKindIcon kind={kind} size={16} />
                    {getKindMeta(kind).label}
                  </>
                ),
                count: kindCounts.get(kind),
              })),
            ]}
          />

          <div className="bg-muted/20 p-5">
            {isLoading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-xl" />
                ))}
              </div>
            ) : isEmpty ? (
              <FilesEmptyState
                searching={isSearching}
                filtered={isSearching || !!activeKind || !!activeTag}
              />
            ) : files.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {isSearching
                  ? "No files match this search."
                  : "No files in this folder yet."}
              </p>
            ) : layout === LayoutMode.Grid ? (
              <div className="grid gap-5 md:grid-cols-2">
                {files.map((doc) => (
                  <DocumentCard key={doc.Id} document={doc} />
                ))}
              </div>
            ) : (
              <DocumentsTable documents={files} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
