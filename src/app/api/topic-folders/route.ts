import type { NextRequest } from "next/server";
import { pagingParams, proxyToBackend } from "@/lib/api-route";

export async function GET(request: NextRequest) {
  const topicId = request.nextUrl.searchParams.get("topicId");

  const params = pagingParams(request, 100);
  if (topicId) params.set("topicId", topicId);

  return proxyToBackend({
    method: "get",
    path: `/v1/TopicFolders?${params}`,
    errorMessage: "Failed to fetch folders",
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend({
    method: "post",
    path: "/v1/TopicFolders",
    request,
    status: 201,
    errorMessage: "Failed to create folder",
  });
}
