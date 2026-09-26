export interface Topic {
  Id: string;
  Title: string;
  Description: string | null;
  Color: string | null;
  IsArchived: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface TopicListParams {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

export interface CreateTopicPayload {
  Title: string;
  Description?: string;
  Color?: string;
}

export type UpdateTopicPayload = Partial<
  CreateTopicPayload & { IsArchived: boolean }
>;
