import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  Course,
  CreateCoursePayload,
  UpdateCoursePayload,
} from "./interface";

async function createCourse(payload: CreateCoursePayload): Promise<Course> {
  const { data } = await clientAxios.post<Course>("/courses", payload);
  return data;
}

interface UpdateCourseVariables {
  id: string;
  payload: UpdateCoursePayload;
}

async function updateCourse({
  id,
  payload,
}: UpdateCourseVariables): Promise<Course> {
  const { data } = await clientAxios.patch<Course>(`/courses/${id}`, payload);
  return data;
}

async function deleteCourse(id: string): Promise<void> {
  await clientAxios.delete(`/courses/${id}`);
}

function invalidateCourses(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["course-list"] }),
    queryClient.invalidateQueries({ queryKey: ["course-detail"] }),
  ]);
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSettled: () => invalidateCourses(queryClient),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCourse,
    onSettled: () => invalidateCourses(queryClient),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSettled: () => invalidateCourses(queryClient),
  });
}
