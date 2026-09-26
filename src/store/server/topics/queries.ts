import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { PagedResult } from "@/store/server/shared/paged-result";
import type { Topic, TopicListParams } from "./interface";

async function fetchTopics(
  params: TopicListParams,
): Promise<PagedResult<Topic>> {
  const { data } = await clientAxios.get<PagedResult<Topic>>("/topics", {
    params,
  });
  return data;
}

async function fetchTopic(id: string): Promise<Topic> {
  const { data } = await clientAxios.get<Topic>(`/topics/${id}`);
  return data;
}

export function useFetchTopics(params: TopicListParams = {}) {
  return useQuery({
    queryKey: ["topic-list", params],
    queryFn: () => fetchTopics(params),
    placeholderData: keepPreviousData,
  });
}

export function useFetchTopic(id: string | null) {
  return useQuery({
    queryKey: ["topic-detail", id],
    queryFn: () => fetchTopic(id!),
    enabled: !!id,
  });
}
