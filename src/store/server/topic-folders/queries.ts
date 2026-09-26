import { useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { TopicFolderTreeNode } from "./interface";

async function fetchFolderTree(
  topicId: string,
): Promise<TopicFolderTreeNode[]> {
  const { data } = await clientAxios.get<TopicFolderTreeNode[]>(
    "/topic-folders/tree",
    { params: { topicId } },
  );
  return data;
}

export function useFetchFolderTree(topicId: string | null) {
  return useQuery({
    queryKey: ["topic-folder-tree", topicId],
    queryFn: () => fetchFolderTree(topicId!),
    enabled: !!topicId,
  });
}
