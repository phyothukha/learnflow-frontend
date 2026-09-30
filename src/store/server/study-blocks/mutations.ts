import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  CreateStudyBlockPayload,
  ListResponse,
  StudyBlock,
  UpdateStudyBlockPayload,
} from "./interface";

async function createStudyBlock(
  payload: CreateStudyBlockPayload,
): Promise<StudyBlock> {
  const { data } = await clientAxios.post<StudyBlock>("/study-blocks", payload);
  return data;
}

interface UpdateStudyBlockVariables {
  id: string;
  payload: UpdateStudyBlockPayload;
}

async function updateStudyBlock({
  id,
  payload,
}: UpdateStudyBlockVariables): Promise<StudyBlock> {
  const { data } = await clientAxios.patch<StudyBlock>(
    `/study-blocks/${id}`,
    payload,
  );
  return data;
}

async function deleteStudyBlock(id: string): Promise<void> {
  await clientAxios.delete(`/study-blocks/${id}`);
}

export function useCreateStudyBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStudyBlock,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["study-block-list"] }),
  });
}

export function useUpdateStudyBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStudyBlock,
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["study-block-list"] });
      const snapshot = queryClient.getQueriesData<ListResponse<StudyBlock>>({
        queryKey: ["study-block-list"],
      });
      queryClient.setQueriesData<ListResponse<StudyBlock>>(
        { queryKey: ["study-block-list"] },
        (list) =>
          list && {
            ...list,
            value: list.value.map((block) =>
              block.Id === id ? { ...block, ...payload } : block,
            ),
          },
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["study-block-list"] }),
  });
}

export function useDeleteStudyBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStudyBlock,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["study-block-list"] }),
  });
}
