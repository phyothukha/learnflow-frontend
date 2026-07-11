import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { CreateNotePayload, Note, UpdateNotePayload } from "./interface";

async function createNote(payload: CreateNotePayload): Promise<Note> {
  const { data } = await clientAxios.post<Note>("/notes", payload);
  return data;
}

async function updateNote({
  id,
  payload,
}: {
  id: string;
  payload: UpdateNotePayload;
}): Promise<Note> {
  const { data } = await clientAxios.patch<Note>(`/notes/${id}`, payload);
  return data;
}

async function deleteNote(id: string): Promise<void> {
  await clientAxios.delete(`/notes/${id}`);
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNote,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["note-list"] }),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNote,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["note-list"] }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNote,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["note-list"] }),
  });
}
