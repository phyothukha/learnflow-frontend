import type { Course } from "@/store/server/courses/interface";

export interface ListResponse<T> {
  "@odata.count": number;
  value: T[];
}

export type EnrollmentStatus = "Pending" | "Active" | "Completed" | "Cancelled";

export interface Enrollment {
  Id: string;
  CourseId: string;
  StudentName: string;
  StudentEmail: string;
  Status: EnrollmentStatus;
  ProgressPercent: number;
  CreatedAt: string;
  UpdatedAt: string;
  Course?: Course | null;
}

export interface EnrollmentListParams {
  page: number;
  limit: number;
  search?: string;
  expand?: string;
  orderby?: string;
}

export interface CreateEnrollmentPayload {
  CourseId: string;
  StudentName: string;
  StudentEmail: string;
  Status?: EnrollmentStatus;
  ProgressPercent?: number;
}

export type UpdateEnrollmentPayload = Partial<CreateEnrollmentPayload>;
