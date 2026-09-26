import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  CreateTopicFolderPayload,
  TopicFolder,
  UpdateTopicFolderPayload,
} from "./interface";

async function createFolder(
  payload: CreateTopicFolderPayload,
): Promise<TopicFolder> {
  const { data } = await clientAxios.post<TopicFolder>(
    "/topic-folders",
    payload,
  );
  return data;
}

async function updateFolder({
  id,
  payload,
}: {
  id: string;
  payload: UpdateTopicFolderPayload;
}): Promise<TopicFolder> {
  const { data } = await clientAxios.patch<TopicFolder>(
    `/topic-folders/${id}`,
    payload,
  );
  return data;
}

async function moveFolder({
  id,
  parentFolderId,
}: {
  id: string;
  parentFolderId: string | null;
}): Promise<TopicFolder> {
  const { data } = await clientAxios.post<TopicFolder>(
    `/topic-folders/${id}/move`,
    { ParentFolderId: parentFolderId },
  );
  return data;
}

async function deleteFolder(id: string): Promise<void> {
  await clientAxios.delete(`/topic-folders/${id}`);
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFolder,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["topic-folder-tree"] }),
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFolder,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["topic-folder-tree"] }),
  });
}

export function useMoveFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveFolder,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["topic-folder-tree"] }),
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFolder,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-folder-tree"] });
      queryClient.invalidateQueries({ queryKey: ["document-list"] });
    },
  });
}
