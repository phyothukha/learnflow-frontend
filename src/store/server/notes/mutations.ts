import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { CreateNotePayload, Note, UpdateNotePayload } from "./interface";

async function createNote(payload: CreateNotePayload): Promise<Note> {
  const { data } = await clientAxios.post<Note>("/notes", payload);
  return data;
}

interface UpdateNoteVariables {
  id: string;
  payload: UpdateNotePayload;
}

async function updateNote({ id, payload }: UpdateNoteVariables): Promise<Note> {
  const { data } = await clientAxios.patch<Note>(`/notes/${id}`, payload);
  return data;
}

async function deleteNote(id: string): Promise<void> {
  await clientAxios.delete(`/notes/${id}`);
}

function invalidateNotes(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["note-list"] }),
    queryClient.invalidateQueries({ queryKey: ["note-detail"] }),
  ]);
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNote,
    onSettled: () => invalidateNotes(queryClient),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNote,
    onSettled: () => invalidateNotes(queryClient),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNote,
    onSettled: () => invalidateNotes(queryClient),
  });
}
