export interface ListResponse<T> {
  "@odata.count": number;
  value: T[];
}

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
  search?: string;
  includeArchived?: boolean;
  orderby?: string;
}

export interface CreateTopicPayload {
  Title: string;
  Description?: string;
  Color?: string;
}

export type UpdateTopicPayload = Partial<
  CreateTopicPayload & { IsArchived: boolean }
>;
