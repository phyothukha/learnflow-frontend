import type { Topic } from "@/store/server/topics/interface";
import type { StudyDocument } from "@/store/server/documents/interface";

export interface ListResponse<T> {
  "@odata.count": number;
  value: T[];
}

export interface Note {
  Id: string;
  TopicId: string;
  DocumentId: string | null;
  Title: string;
  Content: string | null;
  Topic?: Topic;
  Document?: StudyDocument;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface NoteListParams {
  page?: number;
  limit?: number;
  search?: string;
  topicId?: string;
  documentId?: string;
  expand?: string;
  orderby?: string;
}

export interface CreateNotePayload {
  TopicId: string;
  DocumentId?: string;
  Title: string;
  Content?: string;
}

export type UpdateNotePayload = Partial<Omit<CreateNotePayload, "TopicId">>;
