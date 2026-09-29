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
import { ALL_FILES_COLOR, cn, folderColor } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  useCreateFolder,
  useDeleteFolder,
  useUpdateFolder,
} from "@/store/server/topic-folders/mutations";
import type { TopicFolderTreeNode } from "@/store/server/topic-folders/interface";

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

export interface FlatFolder {
  node: TopicFolderTreeNode;
  depth: number;
}

export function flattenFolders(
  nodes: TopicFolderTreeNode[],
  depth = 0,
): FlatFolder[] {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenFolders(node.Children, depth + 1),
  ]);
}

export function collectFolderIds(node: TopicFolderTreeNode): string[] {
  return [node.Id, ...node.Children.flatMap(collectFolderIds)];
}

interface FolderGlyphProps {
  color: string;
  className?: string;
}

function FolderGlyph({ color, className }: FolderGlyphProps) {
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

export interface FolderBreadcrumbProps {
  path: TopicFolderTreeNode[];
  onNavigate: (folderId: string | null) => void;
}

export function FolderBreadcrumb({ path, onNavigate }: FolderBreadcrumbProps) {
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

export interface FolderSidebarProps {
  tree: TopicFolderTreeNode[];
  currentPath: TopicFolderTreeNode[];
  totalFiles: number;
  countByFolder: Map<string, number>;
  onNavigate: (folderId: string | null) => void;
  onCreate: (parentFolderId: string | null) => void;
  className?: string;
}

export function FolderSidebar({
  tree,
  currentPath,
  totalFiles,
  countByFolder,
  onNavigate,
  onCreate,
  className,
}: FolderSidebarProps) {
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
    <aside className={cn("library-card", className)}>
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

export interface FolderCardProps {
  node: TopicFolderTreeNode;
  fileCount: number;
  onOpen: () => void;
  onAddSubfolder: () => void;
  onRename: () => void;
  onDeleted: () => void;
}

export function FolderCard({
  node,
  fileCount,
  onOpen,
  onAddSubfolder,
  onRename,
  onDeleted,
}: FolderCardProps) {
  const queryClient = useQueryClient();
  const deleteFolder = useDeleteFolder();
  const { confirmDelete, dialogProps } = useConfirmDialog();
  const subfolderCount = node.Children.length;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className={cn(
          "group relative flex cursor-pointer flex-col gap-5 p-4 transition-all outline-none hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(15,23,42,0.1)] focus-visible:ring-2 focus-visible:ring-ring",
          "library-card",
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
                  void confirmDelete({
                    itemName: node.Name,
                    description:
                      "Its subfolders are removed and their documents move to the top level.",
                    successMessage: "Folder deleted",
                    errorMessage: "Failed to delete folder",
                    onConfirm: async () => {
                      await deleteFolder.mutateAsync(node.Id);
                      queryClient.invalidateQueries({
                        queryKey: ["document-list"],
                      });
                      onDeleted();
                    },
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
      <ConfirmDialog {...dialogProps} />
    </>
  );
}

export interface NewFolderCardProps {
  onClick: () => void;
}

export function NewFolderCard({ onClick }: NewFolderCardProps) {
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

export enum FolderDialogType {
  Create = "create",
  Rename = "rename",
}

export interface CreateFolderDialogState {
  type: FolderDialogType.Create;
  parentFolderId: string | null;
}

export interface RenameFolderDialogState {
  type: FolderDialogType.Rename;
  folder: TopicFolderTreeNode;
}

export type FolderDialogState =
  CreateFolderDialogState | RenameFolderDialogState;

export interface FolderNameDialogProps {
  topicId: string;
  state: FolderDialogState;
  onClose: () => void;
}

export function FolderNameDialog({
  topicId,
  state,
  onClose,
}: FolderNameDialogProps) {
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const [name, setName] = useState(
    state.type === FolderDialogType.Rename ? state.folder.Name : "",
  );
  const pending = createFolder.isPending || updateFolder.isPending;

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }
    if (state.type === FolderDialogType.Rename) {
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
            {state.type === FolderDialogType.Rename
              ? "Rename folder"
              : "New folder"}
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
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {state.type === FolderDialogType.Rename ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
