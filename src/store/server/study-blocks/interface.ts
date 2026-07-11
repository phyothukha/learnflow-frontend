import type { Topic } from "@/store/server/topics/interface";

export interface ListResponse<T> {
  "@odata.count": number;
  value: T[];
}

export type StudyBlockStatus = "Upcoming" | "Active" | "Done" | "Missed";

export interface StudyBlock {
  Id: string;
  TopicId: string | null;
  Title: string;
  StartAt: string;
  EndAt: string;
  Status: StudyBlockStatus;
  ReminderMinutesBefore: number;
  RecurrenceRule: string | null;
  Topic?: Topic | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface StudyBlockListParams {
  page?: number;
  limit?: number;
  topicId?: string;
  /** ISO datetime lower bound (StartAt ge from) */
  from?: string;
  /** ISO datetime upper bound (StartAt lt to) */
  to?: string;
  expand?: string;
  orderby?: string;
}

export interface CreateStudyBlockPayload {
  TopicId?: string;
  Title: string;
  StartAt: string;
  EndAt: string;
  Status?: StudyBlockStatus;
  ReminderMinutesBefore?: number;
  RecurrenceRule?: string;
}

export type UpdateStudyBlockPayload = Partial<CreateStudyBlockPayload>;
