import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  DocumentListParams,
  ListResponse,
  StudyDocument,
} from "./interface";

async function fetchDocuments(
  params: DocumentListParams,
): Promise<ListResponse<StudyDocument>> {
  const { data } = await clientAxios.get<ListResponse<StudyDocument>>(
    "/documents",
    { params },
  );
  return data;
}

async function fetchDocument(id: string): Promise<StudyDocument> {
  const { data } = await clientAxios.get<StudyDocument>(`/documents/${id}`);
  return data;
}

export function useFetchDocuments(params: DocumentListParams = {}) {
  return useQuery({
    queryKey: ["document-list", params],
    queryFn: () => fetchDocuments(params),
    placeholderData: keepPreviousData,
  });
}

export function useFetchDocument(id: string | null) {
  return useQuery({
    queryKey: ["document-detail", id],
    queryFn: () => fetchDocument(id!),
    enabled: !!id,
  });
}
