"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatedTabs } from "@/components/animated-tabs";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useWorkspaceStore } from "@/store/client/workspace";
import { useFetchDocuments } from "@/store/server/documents/queries";
import { useFetchFolderTree } from "@/store/server/topic-folders/queries";
import { useFetchTopics } from "@/store/server/topics/queries";
import { DocumentsDialogs } from "../components/documents-dialogs";
import {
  collectFolderIds,
  findFolderPath,
  flattenFolders,
  FolderDialogType,
  FolderNameDialog,
  type FolderDialogState,
} from "../components/folder-explorer";
import DocumentsProvider from "../context/documents-context";
import { TopicFilesView } from "./components/topic-files-view";
import { TopicFoldersView } from "./components/topic-folders-view";
import { TopicHeader } from "./components/topic-header";
import { TopicNotFound } from "./components/topic-not-found";
import {
  TopicPrimaryButtons,
  TopicTab,
} from "./components/topic-primary-buttons";

interface TopicDocumentsPageParams {
  topicId: string;
}

interface TopicDocumentsPageSearchParams {
  folder?: string;
  tab?: string;
}

interface TopicDocumentsPageProps {
  params: Promise<TopicDocumentsPageParams>;
  searchParams: Promise<TopicDocumentsPageSearchParams>;
}

interface BuildHrefOptions {
  folderId?: string | null;
  tab?: TopicTab;
}

export default function TopicDocumentsPage({
  params,
  searchParams,
}: TopicDocumentsPageProps) {
  const { topicId } = use(params);
  const { folder: folderParam, tab: tabParam } = use(searchParams);
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.DOCUMENTS_VIEW);
  const setActiveTopic = useWorkspaceStore((s) => s.setActiveTopic);

  const activeTab: TopicTab =
    tabParam === TopicTab.Files ? TopicTab.Files : TopicTab.Folders;

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
  if (!topicsLoading && !topic) return <TopicNotFound />;

  const buildHref = (next: BuildHrefOptions) => {
    const params = new URLSearchParams();
    const folderId =
      next.folderId !== undefined ? next.folderId : (folderParam ?? null);
    const tab = next.tab ?? activeTab;
    if (folderId) params.set("folder", folderId);
    if (tab === TopicTab.Files) params.set("tab", TopicTab.Files);
    const qs = params.toString();
    return `/library/${topicId}${qs ? `?${qs}` : ""}`;
  };

  const navigateFolder = (folderId: string | null) =>
    router.push(buildHref({ folderId }));

  const openCreateFolder = (parentFolderId: string | null) =>
    setFolderDialog({ type: FolderDialogType.Create, parentFolderId });

  const filesInCurrent = allDocuments.filter(
    (doc) => (doc.FolderId ?? null) === (currentFolder?.Id ?? null),
  ).length;

  return (
    <DocumentsProvider>
      <div className="space-y-6">
        <TopicHeader topic={topic}>
          <TopicPrimaryButtons
            activeTab={activeTab}
            topicId={topicId}
            currentFolderId={currentFolder?.Id ?? null}
            tree={tree}
            onCreateFolder={openCreateFolder}
          />
        </TopicHeader>

        <AnimatedTabs
          value={activeTab}
          onValueChange={(tab) => router.push(buildHref({ tab }))}
          tabs={[
            {
              value: TopicTab.Folders,
              label: "Folders",
              count: childFolders.length,
            },
            { value: TopicTab.Files, label: "Files", count: filesInCurrent },
          ]}
        />

        {activeTab === TopicTab.Folders ? (
          <TopicFoldersView
            path={path}
            folders={childFolders}
            countByFolder={countByFolder}
            isLoading={foldersLoading}
            onNavigate={navigateFolder}
            onCreateFolder={openCreateFolder}
            onRenameFolder={(folder) =>
              setFolderDialog({ type: FolderDialogType.Rename, folder })
            }
          />
        ) : (
          <TopicFilesView
            documents={allDocuments}
            tree={tree}
            path={path}
            countByFolder={countByFolder}
            isLoading={documentsLoading}
            onNavigate={navigateFolder}
            onCreateFolder={openCreateFolder}
          />
        )}

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
