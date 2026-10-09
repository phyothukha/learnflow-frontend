import type { NextRequest } from "next/server";
import { pagingParams, proxyToBackend } from "@/lib/api-route";

const FORWARDED_FILTERS = ["search", "topicId", "folderId", "status", "tag"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const params = pagingParams(request, 100);
  for (const key of FORWARDED_FILTERS) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  return proxyToBackend({
    method: "get",
    path: `/v1/Documents?${params}`,
    errorMessage: "Failed to fetch documents",
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend({
    method: "post",
    path: "/v1/Documents",
    request,
    status: 201,
    errorMessage: "Failed to create document",
  });
}
