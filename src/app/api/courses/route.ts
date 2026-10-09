import type { NextRequest } from "next/server";
import { pagingParams, proxyToBackend } from "@/lib/api-route";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") ?? "";
  const isPublished = searchParams.get("isPublished");

  const params = pagingParams(request, 10);
  if (search) params.set("search", search);
  if (isPublished === "true" || isPublished === "false")
    params.set("isPublished", isPublished);

  return proxyToBackend({
    method: "get",
    path: `/v1/Courses?${params}`,
    errorMessage: "Failed to fetch courses",
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend({
    method: "post",
    path: "/v1/Courses",
    request,
    status: 201,
    errorMessage: "Failed to create course",
  });
}
