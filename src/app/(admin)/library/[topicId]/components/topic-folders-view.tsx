"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { TopicFolderTreeNode } from "@/store/server/topic-folders/interface";
import {
  FolderBreadcrumb,
  FolderCard,
  NewFolderCard,
} from "../../components/folder-explorer";

const GRID_CLASS = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

interface TopicFoldersViewProps {
  path: TopicFolderTreeNode[];
  folders: TopicFolderTreeNode[];
  countByFolder: Map<string, number>;
  isLoading: boolean;
  onNavigate: (folderId: string | null) => void;
  onCreateFolder: (parentFolderId: string | null) => void;
  onRenameFolder: (folder: TopicFolderTreeNode) => void;
}

export function TopicFoldersView({
  path,
  folders,
  countByFolder,
  isLoading,
  onNavigate,
  onCreateFolder,
  onRenameFolder,
}: TopicFoldersViewProps) {
  const currentFolder = path[path.length - 1] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2">
        <FolderBreadcrumb path={path} onNavigate={onNavigate} />
      </div>

      {isLoading ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className={GRID_CLASS}>
          {folders.map((node) => (
            <FolderCard
              key={node.Id}
              node={node}
              fileCount={countByFolder.get(node.Id) ?? 0}
              onOpen={() => onNavigate(node.Id)}
              onAddSubfolder={() => onCreateFolder(node.Id)}
              onRename={() => onRenameFolder(node)}
              onDeleted={() => {
                if (path.some((p) => p.Id === node.Id))
                  onNavigate(currentFolder?.ParentFolderId ?? null);
              }}
            />
          ))}
          <NewFolderCard
            onClick={() => onCreateFolder(currentFolder?.Id ?? null)}
          />
        </div>
      )}
    </div>
  );
}
