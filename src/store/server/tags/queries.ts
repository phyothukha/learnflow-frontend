import { useQuery } from "@tanstack/react-query";
import { clientAxios } from "@/lib/axios";
import type { Tag } from "./interface";

async function fetchTags(): Promise<Tag[]> {
  const { data } = await clientAxios.get<Tag[]>("/tags");
  return data;
}

export function useFetchTags() {
  return useQuery({
    queryKey: ["tag-list"],
    queryFn: fetchTags,
  });
}
