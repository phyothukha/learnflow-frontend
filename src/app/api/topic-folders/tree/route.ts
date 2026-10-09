import { NextResponse, type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-route";

export async function GET(request: NextRequest) {
  const topicId = request.nextUrl.searchParams.get("topicId");
  if (!topicId)
    return NextResponse.json(
      { message: "topicId is required" },
      { status: 400 },
    );

  return proxyToBackend({
    method: "get",
    path: `/v1/TopicFolders/tree?${new URLSearchParams({ topicId })}`,
    errorMessage: "Failed to fetch folder tree",
  });
}
