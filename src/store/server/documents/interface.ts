export type DocumentStatus = "Unread" | "InProgress" | "Completed";

export interface Attachment {
  Id: string;
  FileName: string;
  Url: string;
  ContentType: string;
  SizeBytes: number;
  CreatedAt: string;
}

export interface StudyDocument {
  Id: string;
  TopicId: string;
  FolderId: string | null;
  Title: string;
  FileUrl: string | null;
  FileType: string | null;
  Content: string | null;
  Status: DocumentStatus;
  TimeSpentMinutes: number;
  LastOpenedAt: string | null;
  Tags: string[];
  Attachments: Attachment[];
  CreatedAt: string;
  UpdatedAt: string;
}

export interface DocumentListParams {
  page?: number;
  limit?: number;
  search?: string;
  topicId?: string;
  folderId?: string;
  status?: DocumentStatus;
  tag?: string;
}

export interface CreateDocumentPayload {
  TopicId: string;
  FolderId?: string;
  Title: string;
  FileUrl?: string;
  FileType?: string;
  Content?: string;
  Status?: DocumentStatus;
  Tags?: string[];
}

export type UpdateDocumentPayload = Partial<
  Omit<CreateDocumentPayload, "TopicId" | "FolderId"> & {
    TimeSpentMinutes: number;
    LastOpenedAt: string;
  }
>;
