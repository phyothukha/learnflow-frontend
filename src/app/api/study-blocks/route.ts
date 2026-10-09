import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-route";
import { buildQuery } from "@/utils/query";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 100);
  const topicId = searchParams.get("topicId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const expand = searchParams.get("expand") ?? "Topic";
  const orderby = searchParams.get("orderby") ?? "StartAt asc";

  const filters: string[] = [];
  if (topicId) filters.push(`TopicId eq ${topicId}`);
  if (from) filters.push(`StartAt ge ${from}`);
  if (to) filters.push(`StartAt lt ${to}`);

  const query = buildQuery({
    page,
    limit,
    expand,
    orderby,
    filter: filters.length ? filters.join(" and ") : undefined,
  });

  return proxyToBackend({
    method: "get",
    path: `/v1/StudyBlocks?${query}`,
    errorMessage: "Failed to fetch study blocks",
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend({
    method: "post",
    path: "/v1/StudyBlocks",
    request,
    status: 201,
    errorMessage: "Failed to create study block",
  });
}
