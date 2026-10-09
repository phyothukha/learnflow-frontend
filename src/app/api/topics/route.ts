import type { NextRequest } from "next/server";
import { pagingParams, proxyToBackend } from "@/lib/api-route";

export async function GET(request: NextRequest) {
  const includeArchived =
    request.nextUrl.searchParams.get("includeArchived") === "true";

  const params = pagingParams(request, 100);
  if (!includeArchived) params.set("isArchived", "false");

  return proxyToBackend({
    method: "get",
    path: `/v1/Topics?${params}`,
    errorMessage: "Failed to fetch topics",
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend({
    method: "post",
    path: "/v1/Topics",
    request,
    status: 201,
    errorMessage: "Failed to create topic",
  });
}
