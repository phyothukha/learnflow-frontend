import type { NextRequest } from "next/server";
import { pagingParams, proxyToBackend } from "@/lib/api-route";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const topicId = searchParams.get("topicId");
  const documentId = searchParams.get("documentId");

  const params = pagingParams(request, 100);
  if (topicId) params.set("topicId", topicId);
  if (documentId) params.set("documentId", documentId);

  return proxyToBackend({
    method: "get",
    path: `/v1/Notes?${params}`,
    errorMessage: "Failed to fetch notes",
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend({
    method: "post",
    path: "/v1/Notes",
    request,
    status: 201,
    errorMessage: "Failed to create note",
  });
}
