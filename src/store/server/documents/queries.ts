import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { PagedResult } from "@/store/server/shared/paged-result";
import type { DocumentListParams, StudyDocument } from "./interface";

async function fetchDocuments(
  params: DocumentListParams,
): Promise<PagedResult<StudyDocument>> {
  const { data } = await clientAxios.get<PagedResult<StudyDocument>>(
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
