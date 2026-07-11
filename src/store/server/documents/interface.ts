import type { Topic } from "@/store/server/topics/interface";

export interface ListResponse<T> {
  "@odata.count": number;
  value: T[];
}

export type DocumentStatus = "Unread" | "InProgress" | "Completed";

export interface StudyDocument {
  Id: string;
  TopicId: string;
  FolderId: string | null;
  Title: string;
  FileUrl: string | null;
  FileType: string | null;
  Status: DocumentStatus;
  TimeSpentMinutes: number;
  LastOpenedAt: string | null;
  Topic?: Topic;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface DocumentListParams {
  page?: number;
  limit?: number;
  search?: string;
  topicId?: string;
  status?: DocumentStatus;
  expand?: string;
  orderby?: string;
}

export interface CreateDocumentPayload {
  TopicId: string;
  FolderId?: string;
  Title: string;
  FileUrl?: string;
  FileType?: string;
  Status?: DocumentStatus;
}

export type UpdateDocumentPayload = Partial<
  Omit<CreateDocumentPayload, "TopicId"> & {
    TimeSpentMinutes: number;
    LastOpenedAt: string;
  }
>;
