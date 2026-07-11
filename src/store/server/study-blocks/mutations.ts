import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  CreateStudyBlockPayload,
  StudyBlock,
  UpdateStudyBlockPayload,
} from "./interface";

async function createStudyBlock(
  payload: CreateStudyBlockPayload,
): Promise<StudyBlock> {
  const { data } = await clientAxios.post<StudyBlock>("/study-blocks", payload);
  return data;
}

async function updateStudyBlock({
  id,
  payload,
}: {
  id: string;
  payload: UpdateStudyBlockPayload;
}): Promise<StudyBlock> {
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
