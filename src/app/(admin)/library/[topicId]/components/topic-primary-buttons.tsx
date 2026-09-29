"use client";

import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TopicFolderTreeNode } from "@/store/server/topic-folders/interface";
import {
  CreateDocumentDialog,
  CreateDocumentMode,
} from "../../components/create-document-dialog";
import { flattenFolders } from "../../components/folder-explorer";

export enum TopicTab {
  Folders = "folders",
  Files = "files",
}

interface TopicPrimaryButtonsProps {
  activeTab: TopicTab;
  topicId: string;
  currentFolderId: string | null;
  tree: TopicFolderTreeNode[];
  onCreateFolder: (parentFolderId: string | null) => void;
}

export function TopicPrimaryButtons({
  activeTab,
  topicId,
  currentFolderId,
  tree,
  onCreateFolder,
}: TopicPrimaryButtonsProps) {
  const router = useRouter();

  if (activeTab === TopicTab.Folders) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onCreateFolder(currentFolderId)}
      >
        <FolderPlus className="size-4" />
        New folder
      </Button>
    );
  }

  return (
    <CreateDocumentDialog
      topicId={topicId}
      defaultFolderId={currentFolderId}
      folderOptions={flattenFolders(tree).map(({ node, depth }) => ({
        id: node.Id,
        label: `${"— ".repeat(depth)}${node.Name}`,
      }))}
      onCreated={(doc, mode) =>
        router.push(
          `/library/${topicId}/${doc.Id}${mode === CreateDocumentMode.Write ? "?edit=1" : ""}`,
        )
      }
    />
  );
}
