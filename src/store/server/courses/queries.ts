import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { PagedResult } from "@/store/server/shared/paged-result";
import type { Course, CourseListParams } from "./interface";

async function fetchCourses(
  params: CourseListParams,
): Promise<PagedResult<Course>> {
  const { data } = await clientAxios.get<PagedResult<Course>>("/courses", {
    params,
  });
  return data;
}

async function fetchCourse(id: string): Promise<Course> {
  const { data } = await clientAxios.get<Course>(`/courses/${id}`);
  return data;
}

export function useFetchCourses(params: CourseListParams) {
  return useQuery({
    queryKey: ["course-list", params],
    queryFn: () => fetchCourses(params),
    placeholderData: keepPreviousData,
  });
}

export function useFetchCourse(id: string | null) {
  return useQuery({
    queryKey: ["course-detail", id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });
}
