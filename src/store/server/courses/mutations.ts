import { useMutation, useQueryClient } from "@tanstack/react-query";
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

async function updateCourse({
  id,
  payload,
}: {
  id: string;
  payload: UpdateCoursePayload;
}): Promise<Course> {
  const { data } = await clientAxios.patch<Course>(`/courses/${id}`, payload);
  return data;
}

async function deleteCourse(id: string): Promise<void> {
  await clientAxios.delete(`/courses/${id}`);
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["course-list"] }),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCourse,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["course-list"] }),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["course-list"] }),
  });
}
