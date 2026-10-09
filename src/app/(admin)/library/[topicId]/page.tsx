"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PERMISSIONS } from "@/lib/permissions";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { useWorkspaceStore } from "@/store/client/use-store";
import { useFetchDocuments } from "@/store/server/documents/queries";
import { useFetchFolderTree } from "@/store/server/topic-folders/queries";
import { useFetchTopics } from "@/store/server/topics/queries";
import { countDocumentsByFolder, findFolderPath } from "@/utils/folder";
import { DocumentsDialogs } from "../components/documents-dialogs";
import {
  FolderDialogType,
  FolderNameDialog,
  type FolderDialogState,
} from "../components/folder-explorer";
import DocumentsProvider from "../context/documents-context";
import { TopicExplorerView } from "./components/topic-explorer-view";
import { TopicHeader } from "./components/topic-header";
import { TopicNotFound } from "./components/topic-not-found";
import { TopicPrimaryButtons } from "./components/topic-primary-buttons";

interface TopicDocumentsPageParams {
  topicId: string;
}

interface TopicDocumentsPageSearchParams {
  folder?: string;
}

interface TopicDocumentsPageProps {
  params: Promise<TopicDocumentsPageParams>;
  searchParams: Promise<TopicDocumentsPageSearchParams>;
}

export default function TopicDocumentsPage({
  params,
  searchParams,
}: TopicDocumentsPageProps) {
  const { topicId } = use(params);
  const { folder: folderParam } = use(searchParams);
  const router = useRouter();
  const canView = useRequirePermission(PERMISSIONS.DOCUMENTS_VIEW);
  const { setActiveTopic } = useWorkspaceStore();

  const [folderDialog, setFolderDialog] = useState<FolderDialogState | null>(
    null,
  );

  const { data: topicsData, isLoading: topicsLoading } = useFetchTopics({
    limit: 100,
  });
  const { data: folderTree, isLoading: foldersLoading } =
    useFetchFolderTree(topicId);
  const { data: documentsData, isLoading: documentsLoading } =
    useFetchDocuments({ limit: 500, topicId });

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

  const countByFolder = useMemo(
    () => countDocumentsByFolder(allDocuments, tree),
    [allDocuments, tree],
  );

  if (!canView) return null;

  const topic = topicsData?.Items.find((t) => t.Id === topicId);
  if (!topicsLoading && !topic) return <TopicNotFound />;

  const buildHref = (folderId?: string | null) => {
    const params = new URLSearchParams();
    const nextFolder =
      folderId !== undefined ? folderId : (folderParam ?? null);
    if (nextFolder) params.set("folder", nextFolder);
    const qs = params.toString();
    return `/library/${topicId}${qs ? `?${qs}` : ""}`;
  };

  const navigateFolder = (folderId: string | null) =>
    router.push(buildHref(folderId));

  const openCreateFolder = (parentFolderId: string | null) =>
    setFolderDialog({ type: FolderDialogType.Create, parentFolderId });

  return (
    <DocumentsProvider>
      <div className="space-y-6">
        <TopicHeader topic={topic}>
          <TopicPrimaryButtons
            topicId={topicId}
            currentFolderId={currentFolder?.Id ?? null}
            tree={tree}
            onCreateFolder={openCreateFolder}
          />
        </TopicHeader>

        <TopicExplorerView
          documents={allDocuments}
          tree={tree}
          path={path}
          folders={childFolders}
          countByFolder={countByFolder}
          isLoading={foldersLoading || documentsLoading}
          onNavigate={navigateFolder}
          onCreateFolder={openCreateFolder}
          onRenameFolder={(folder) =>
            setFolderDialog({ type: FolderDialogType.Rename, folder })
          }
        />

        {folderDialog && (
          <FolderNameDialog
            topicId={topicId}
            state={folderDialog}
            onClose={() => setFolderDialog(null)}
          />
        )}
      </div>
      <DocumentsDialogs />
    </DocumentsProvider>
  );
}
