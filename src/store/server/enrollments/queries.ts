import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { Enrollment, EnrollmentListParams } from "./interface";
import type { ListResponse } from "@/store/server/shared/list-response";

async function fetchEnrollments(
  params: EnrollmentListParams,
): Promise<ListResponse<Enrollment>> {
  const { data } = await clientAxios.get<ListResponse<Enrollment>>(
    "/enrollments",
    { params },
  );
  return data;
}

async function fetchEnrollment(id: string): Promise<Enrollment> {
  const { data } = await clientAxios.get<Enrollment>(`/enrollments/${id}`);
  return data;
}

export function useFetchEnrollments(params: EnrollmentListParams) {
  return useQuery({
    queryKey: ["enrollment-list", params],
    queryFn: () => fetchEnrollments(params),
    placeholderData: keepPreviousData,
  });
}

export function useFetchEnrollment(id: string | null) {
  return useQuery({
    queryKey: ["enrollment-detail", id],
    queryFn: () => fetchEnrollment(id!),
    enabled: !!id,
  });
}
