"use client";

import { Fragment, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useCreateFolder,
  useDeleteFolder,
  useUpdateFolder,
} from "@/store/server/topic-folders/mutations";
import type { TopicFolderTreeNode } from "@/store/server/topic-folders/interface";
import { libraryCardClassName } from "./library-card";

const FOLDER_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#0ea5e9",
  "#eab308",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#14b8a6",
];

export const ALL_FILES_COLOR = "#6366f1";

export function folderColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return FOLDER_COLORS[Math.abs(hash) % FOLDER_COLORS.length];
}

export function findFolderPath(
  nodes: TopicFolderTreeNode[],
  id: string,
): TopicFolderTreeNode[] | null {
  for (const node of nodes) {
    if (node.Id === id) return [node];
    const childPath = findFolderPath(node.Children, id);
    if (childPath) return [node, ...childPath];
  }
  return null;
}

export function flattenFolders(
  nodes: TopicFolderTreeNode[],
  depth = 0,
): { node: TopicFolderTreeNode; depth: number }[] {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenFolders(node.Children, depth + 1),
  ]);
}

export function collectFolderIds(node: TopicFolderTreeNode): string[] {
  return [node.Id, ...node.Children.flatMap(collectFolderIds)];
}

function FolderGlyph({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <Folder
      className={cn("size-7", className)}
      style={{ color }}
      fill="currentColor"
      fillOpacity={0.9}
      strokeWidth={1.25}
    />
  );
}

export function FolderBreadcrumb({
  path,
  onNavigate,
}: {
  path: TopicFolderTreeNode[];
  onNavigate: (folderId: string | null) => void;
}) {
  const current = path[path.length - 1];

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm">
      <FolderGlyph
        color={current ? folderColor(current.Id) : ALL_FILES_COLOR}
        className="size-4 shrink-0"
      />
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className={cn(
          "shrink-0 rounded px-1 font-medium transition-colors hover:text-foreground",
          path.length ? "text-muted-foreground" : "text-foreground",
        )}
      >
        All files
      </button>
      {path.map((node, i) => (
        <Fragment key={node.Id}>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          <button
            type="button"
            onClick={() => onNavigate(node.Id)}
            className={cn(
              "truncate rounded px-1 font-medium transition-colors hover:text-foreground",
              i === path.length - 1
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {node.Name}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}

export function FolderSidebar({
  tree,
  currentPath,
  totalFiles,
  countByFolder,
  onNavigate,
  onCreate,
  className,
}: {
  tree: TopicFolderTreeNode[];
  currentPath: TopicFolderTreeNode[];
  totalFiles: number;
  countByFolder: Map<string, number>;
  onNavigate: (folderId: string | null) => void;
  onCreate: (parentFolderId: string | null) => void;
  className?: string;
}) {
  const currentId = currentPath[currentPath.length - 1]?.Id ?? null;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const isExpanded = (id: string) =>
    !collapsed.has(id) ||
    currentPath.some((p) => p.Id === id && p.Id !== currentId);

  const renderNode = (node: TopicFolderTreeNode, depth: number) => {
    const hasChildren = node.Children.length > 0;
    const expanded = hasChildren && isExpanded(node.Id);
    const active = currentId === node.Id;
    return (
      <li key={node.Id}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md py-1.5 pr-1.5 text-sm transition-colors hover:bg-accent",
            active && "bg-accent font-medium text-foreground",
          )}
          style={{ paddingLeft: 6 + depth * 14 }}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggle(node.Id)}
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground",
              !hasChildren && "pointer-events-none",
            )}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {hasChildren &&
              (expanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              ))}
          </button>
          <button
            type="button"
            onClick={() => onNavigate(node.Id)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <FolderGlyph
              color={folderColor(node.Id)}
              className="size-4 shrink-0"
            />
            <span className="truncate">{node.Name}</span>
          </button>
          <button
            type="button"
            title="New subfolder"
            onClick={() => onCreate(node.Id)}
            className="hidden shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground group-hover:block"
          >
            <Plus className="size-3.5" />
          </button>
          <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums group-hover:hidden">
            {countByFolder.get(node.Id) ?? 0}
          </span>
        </div>
        {expanded && (
          <ul
            className="relative before:absolute before:top-0 before:bottom-1 before:left-[var(--indent)] before:border-l before:border-border"
            style={{ ["--indent" as string]: `${13 + depth * 14}px` }}
          >
            {node.Children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside className={cn(libraryCardClassName, className)}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-semibold">Folders</p>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          title="New folder"
          onClick={() => onCreate(currentId)}
        >
          <FolderPlus className="size-4" />
        </Button>
      </div>
      <div className="max-h-[calc(100svh-16rem)] overflow-y-auto p-2">
        <button
          type="button"
          onClick={() => onNavigate(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
            currentId === null && "bg-accent font-medium",
          )}
        >
          <FolderGlyph color={ALL_FILES_COLOR} className="size-4 shrink-0" />
          <span className="flex-1 text-left">All files</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {totalFiles}
          </span>
        </button>
        {tree.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No folders yet.
          </p>
        ) : (
          <ul className="mt-0.5 space-y-px">
            {tree.map((node) => renderNode(node, 0))}
          </ul>
        )}
      </div>
    </aside>
  );
}

export function FolderCard({
  node,
  fileCount,
  onOpen,
  onAddSubfolder,
  onRename,
  onDeleted,
}: {
  node: TopicFolderTreeNode;
  fileCount: number;
  onOpen: () => void;
  onAddSubfolder: () => void;
  onRename: () => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const deleteFolder = useDeleteFolder();
  const subfolderCount = node.Children.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-5 p-4 transition-all outline-none hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(15,23,42,0.1)] focus-visible:ring-2 focus-visible:ring-ring",
        libraryCardClassName,
      )}
    >
      <div className="flex items-start justify-between">
        <FolderGlyph color={folderColor(node.Id)} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mt-1 -mr-1 size-7 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onClick={onAddSubfolder}>
              <FolderPlus />
              New subfolder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}>
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (
                  !window.confirm(
                    `Delete "${node.Name}"? Its subfolders are removed and their documents move to the top level.`,
                  )
                )
                  return;
                deleteFolder.mutate(node.Id, {
                  onSuccess: () => {
                    queryClient.invalidateQueries({
                      queryKey: ["document-list"],
                    });
                    toast.success("Folder deleted");
                    onDeleted();
                  },
                  onError: () => toast.error("Failed to delete folder"),
                });
              }}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{node.Name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {fileCount} {fileCount === 1 ? "file" : "files"}
          {subfolderCount > 0 &&
            ` · ${subfolderCount} ${subfolderCount === 1 ? "folder" : "folders"}`}
        </p>
      </div>
    </div>
  );
}

export function NewFolderCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[116px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/40 hover:text-foreground"
    >
      <FolderPlus className="size-6" />
      <span className="text-sm font-medium">New folder</span>
    </button>
  );
}

export type FolderDialogState =
  | { type: "create"; parentFolderId: string | null }
  | { type: "rename"; folder: TopicFolderTreeNode };

export function FolderNameDialog({
  topicId,
  state,
  onClose,
}: {
  topicId: string;
  state: FolderDialogState;
  onClose: () => void;
}) {
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const [name, setName] = useState(
    state.type === "rename" ? state.folder.Name : "",
  );
  const pending = createFolder.isPending || updateFolder.isPending;

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }
    if (state.type === "rename") {
      updateFolder.mutate(
        { id: state.folder.Id, payload: { Name: name.trim() } },
        {
          onSuccess: () => {
            toast.success("Folder renamed");
            onClose();
          },
          onError: () => toast.error("Failed to rename folder"),
        },
      );
      return;
    }
    createFolder.mutate(
      {
        TopicId: topicId,
        ParentFolderId: state.parentFolderId ?? undefined,
        Name: name.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Folder created");
          onClose();
        },
        onError: () => toast.error("Failed to create folder"),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {state.type === "rename" ? "Rename folder" : "New folder"}
          </DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {state.type === "rename" ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
