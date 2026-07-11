import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { ListResponse, Note, NoteListParams } from "./interface";

async function fetchNotes(params: NoteListParams): Promise<ListResponse<Note>> {
  const { data } = await clientAxios.get<ListResponse<Note>>("/notes", {
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
