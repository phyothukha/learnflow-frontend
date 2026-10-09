import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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

interface UpdateTopicVariables {
  id: string;
  payload: UpdateTopicPayload;
}

async function updateTopic({
  id,
  payload,
}: UpdateTopicVariables): Promise<Topic> {
  const { data } = await clientAxios.patch<Topic>(`/topics/${id}`, payload);
  return data;
}

async function deleteTopic(id: string): Promise<void> {
  await clientAxios.delete(`/topics/${id}`);
}

function invalidateTopics(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["topic-list"] }),
    queryClient.invalidateQueries({ queryKey: ["topic-detail"] }),
  ]);
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTopic,
    onSettled: () => invalidateTopics(queryClient),
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTopic,
    onSettled: () => invalidateTopics(queryClient),
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTopic,
    onSettled: () => invalidateTopics(queryClient),
  });
}
