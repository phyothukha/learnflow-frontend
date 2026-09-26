import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  Attachment,
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

async function moveDocument({
  id,
  folderId,
}: {
  id: string;
  folderId: string | null;
}): Promise<StudyDocument> {
  const { data } = await clientAxios.post<StudyDocument>(
    `/documents/${id}/move`,
    { FolderId: folderId },
  );
  return data;
}

async function deleteDocument(id: string): Promise<void> {
  await clientAxios.delete(`/documents/${id}`);
}

async function uploadAttachment({
  documentId,
  file,
}: {
  documentId: string;
  file: File;
}): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await clientAxios.post<Attachment>(
    `/documents/${documentId}/attachments`,
    formData,
    // Let the browser set the multipart boundary itself — override the
    // client's default application/json header rather than fixing it.
    { headers: { "Content-Type": undefined } },
  );
  return data;
}

async function deleteAttachment({
  documentId,
  attachmentId,
}: {
  documentId: string;
  attachmentId: string;
}): Promise<void> {
  await clientAxios.delete(
    `/documents/${documentId}/attachments/${attachmentId}`,
  );
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

export function useMoveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveDocument,
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

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadAttachment,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["document-list"] }),
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAttachment,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["document-list"] }),
  });
}
