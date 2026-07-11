import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  CreateDocumentPayload,
  StudyDocument,
  UpdateDocumentPayload,
} from "./interface";

async function createDocument(
  payload: CreateDocumentPayload,
): Promise<StudyDocument> {
  const { data } = await clientAxios.post<StudyDocument>("/documents", payload);
  return data;
}

async function updateDocument({
  id,
  payload,
}: {
  id: string;
  payload: UpdateDocumentPayload;
}): Promise<StudyDocument> {
  const { data } = await clientAxios.patch<StudyDocument>(
    `/documents/${id}`,
    payload,
  );
  return data;
}

async function deleteDocument(id: string): Promise<void> {
  await clientAxios.delete(`/documents/${id}`);
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDocument,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["document-list"] }),
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDocument,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["document-list"] }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["document-list"] }),
  });
}
