export interface Note {
  Id: string;
  TopicId: string;
  DocumentId: string | null;
  Title: string;
  Content: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface NoteListParams {
  page?: number;
  limit?: number;
  topicId?: string;
  documentId?: string;
}

export interface CreateNotePayload {
  TopicId: string;
  DocumentId?: string;
  Title: string;
  Content?: string;
}

export type UpdateNotePayload = Partial<Omit<CreateNotePayload, "TopicId">>;
