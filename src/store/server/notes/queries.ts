import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { PagedResult } from "@/store/server/shared/paged-result";
import type { Note, NoteListParams } from "./interface";

async function fetchNotes(params: NoteListParams): Promise<PagedResult<Note>> {
  const { data } = await clientAxios.get<PagedResult<Note>>("/notes", {
    params,
  });
  return data;
}

async function fetchNote(id: string): Promise<Note> {
  const { data } = await clientAxios.get<Note>(`/notes/${id}`);
  return data;
}

export function useFetchNotes(params: NoteListParams = {}) {
  return useQuery({
    queryKey: ["note-list", params],
    queryFn: () => fetchNotes(params),
    placeholderData: keepPreviousData,
  });
}

export function useFetchNote(id: string | null) {
  return useQuery({
    queryKey: ["note-detail", id],
    queryFn: () => fetchNote(id!),
    enabled: !!id,
  });
}
