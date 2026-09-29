import type { StudyDocument } from "@/store/server/documents/interface";
import type { TopicFolderTreeNode } from "@/store/server/topic-folders/interface";

export interface FlatFolder {
  node: TopicFolderTreeNode;
  depth: number;
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
): FlatFolder[] {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenFolders(node.Children, depth + 1),
  ]);
}

export function collectFolderIds(node: TopicFolderTreeNode): string[] {
  return [node.Id, ...node.Children.flatMap(collectFolderIds)];
}

/** Document count per folder, including documents in nested sub-folders. */
export function countDocumentsByFolder(
  documents: StudyDocument[],
  tree: TopicFolderTreeNode[],
) {
  const docsByFolder = Map.groupBy(documents, (doc) => doc.FolderId);
  return new Map(
    flattenFolders(tree).map(({ node }) => [
      node.Id,
      collectFolderIds(node).reduce(
        (sum, id) => sum + (docsByFolder.get(id)?.length ?? 0),
        0,
      ),
    ]),
  );
}
