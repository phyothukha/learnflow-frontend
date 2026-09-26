"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useCreateFolder,
  useDeleteFolder,
} from "@/store/server/topic-folders/mutations";
import type { TopicFolderTreeNode } from "@/store/server/topic-folders/interface";

export function FolderTree({
  topicId,
  nodes,
  activeFolderId,
  onSelectFolder,
}: {
  topicId: string;
  nodes: TopicFolderTreeNode[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}) {
  const [newFolderParentId, setNewFolderParentId] = useState<
    string | null | undefined
  >(undefined);

  return (
    <div className="space-y-1">
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
          activeFolderId === null && "bg-accent font-medium",
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="size-3.5 text-muted-foreground" />
        All documents
      </button>

      {nodes.map((node) => (
        <FolderNode
          key={node.Id}
          node={node}
          depth={0}
          activeFolderId={activeFolderId}
          onSelectFolder={onSelectFolder}
          onAddChild={setNewFolderParentId}
        />
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground"
        onClick={() => setNewFolderParentId(null)}
      >
        <Plus className="size-3.5" />
        New folder
      </Button>

      {newFolderParentId !== undefined && (
        <CreateFolderDialog
          topicId={topicId}
          parentFolderId={newFolderParentId}
          onClose={() => setNewFolderParentId(undefined)}
        />
      )}
    </div>
  );
}

function FolderNode({
  node,
  depth,
  activeFolderId,
  onSelectFolder,
  onAddChild,
}: {
  node: TopicFolderTreeNode;
  depth: number;
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onAddChild: (parentFolderId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const deleteFolder = useDeleteFolder();
  const hasChildren = node.Children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
          activeFolderId === node.Id && "bg-accent font-medium",
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        <button
          className="shrink-0 text-muted-foreground"
          onClick={() => setExpanded((e) => !e)}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : (
            <span className="inline-block size-3.5" />
          )}
        </button>
        <button
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          onClick={() => onSelectFolder(node.Id)}
        >
          <Folder className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.Name}</span>
        </button>
        <button
          className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
          onClick={() => onAddChild(node.Id)}
          title="New subfolder"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
          onClick={() => {
            deleteFolder.mutate(node.Id, {
              onSuccess: () => {
                toast.success("Folder deleted");
                if (activeFolderId === node.Id) onSelectFolder(null);
              },
              onError: () => toast.error("Failed to delete folder"),
            });
          }}
          title="Delete folder"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.Children.map((child) => (
            <FolderNode
              key={child.Id}
              node={child}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              onSelectFolder={onSelectFolder}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateFolderDialog({
  topicId,
  parentFolderId,
  onClose,
}: {
  topicId: string;
  parentFolderId: string | null;
  onClose: () => void;
}) {
  const createFolder = useCreateFolder();
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }
    createFolder.mutate(
      {
        TopicId: topicId,
        ParentFolderId: parentFolderId ?? undefined,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createFolder.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
