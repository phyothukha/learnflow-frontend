export interface ListResponse<T> {
  "@odata.count": number;
  value: T[];
}

export interface Course {
  Id: string;
  Title: string;
  Description: string | null;
  Category: string | null;
  CoverImageUrl: string | null;
  IsPublished: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CourseListParams {
  page: number;
  limit: number;
  search?: string;
  expand?: string;
  orderby?: string;
}

export interface CreateCoursePayload {
  Title: string;
  Description?: string;
  Category?: string;
  CoverImageUrl?: string;
  IsPublished?: boolean;
}

export type UpdateCoursePayload = Partial<CreateCoursePayload>;
