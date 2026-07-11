import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  ListResponse,
  StudyBlock,
  StudyBlockListParams,
} from "./interface";

async function fetchStudyBlocks(
  params: StudyBlockListParams,
): Promise<ListResponse<StudyBlock>> {
  const { data } = await clientAxios.get<ListResponse<StudyBlock>>(
    "/study-blocks",
    { params },
  );
  return data;
}

export function useFetchStudyBlocks(params: StudyBlockListParams = {}) {
  return useQuery({
    queryKey: ["study-block-list", params],
    queryFn: () => fetchStudyBlocks(params),
    placeholderData: keepPreviousData,
    // Keep the schedule fresh so audio alerts fire on recently added blocks.
    refetchInterval: 60_000,
  });
}
