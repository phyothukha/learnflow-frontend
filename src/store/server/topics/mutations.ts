import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  CreateTopicPayload,
  Topic,
  UpdateTopicPayload,
} from "./interface";

async function createTopic(payload: CreateTopicPayload): Promise<Topic> {
  const { data } = await clientAxios.post<Topic>("/topics", payload);
  return data;
}

async function updateTopic({
  id,
  payload,
}: {
  id: string;
  payload: UpdateTopicPayload;
}): Promise<Topic> {
  const { data } = await clientAxios.patch<Topic>(`/topics/${id}`, payload);
  return data;
}

async function deleteTopic(id: string): Promise<void> {
  await clientAxios.delete(`/topics/${id}`);
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTopic,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["topic-list"] }),
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTopic,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["topic-list"] }),
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTopic,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["topic-list"] }),
  });
}
