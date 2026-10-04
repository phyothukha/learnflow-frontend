"use client";

import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TopicFolderTreeNode } from "@/store/server/topic-folders/interface";
import { CreateDocumentMode } from "@/lib/document-create-modes";
import { CreateDocumentDialog } from "../../components/create-document-dialog";
import { flattenFolders } from "@/utils/folder";

interface TopicPrimaryButtonsProps {
  topicId: string;
  currentFolderId: string | null;
  tree: TopicFolderTreeNode[];
  onCreateFolder: (parentFolderId: string | null) => void;
}

export function TopicPrimaryButtons({
  topicId,
  currentFolderId,
  tree,
  onCreateFolder,
}: TopicPrimaryButtonsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onCreateFolder(currentFolderId)}
      >
        <FolderPlus className="size-4" />
        New folder
      </Button>
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
    </div>
  );
}
