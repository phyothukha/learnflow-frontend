import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type {
  Enrollment,
  CreateEnrollmentPayload,
  UpdateEnrollmentPayload,
} from "./interface";

async function createEnrollment(
  payload: CreateEnrollmentPayload,
): Promise<Enrollment> {
  const { data } = await clientAxios.post<Enrollment>("/enrollments", payload);
  return data;
}

interface UpdateEnrollmentVariables {
  id: string;
  payload: UpdateEnrollmentPayload;
}

async function updateEnrollment({
  id,
  payload,
}: UpdateEnrollmentVariables): Promise<Enrollment> {
  const { data } = await clientAxios.patch<Enrollment>(
    `/enrollments/${id}`,
    payload,
  );
  return data;
}

async function deleteEnrollment(id: string): Promise<void> {
  await clientAxios.delete(`/enrollments/${id}`);
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEnrollment,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["enrollment-list"] }),
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEnrollment,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["enrollment-list"] }),
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEnrollment,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["enrollment-list"] }),
  });
}
