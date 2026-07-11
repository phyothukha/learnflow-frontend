import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { serverAxios } from "@/lib/axios";
import { buildQuery } from "@/lib/buildQuery";
import { isAxiosError } from "axios";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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

  try {
    const { data } = await serverAxios.get(`/v1/StudyBlocks?${query}`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json(
      { message: "Failed to fetch study blocks" },
      { status },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  try {
    const { data } = await serverAxios.post("/v1/StudyBlocks", body, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json(
      { message: "Failed to create study block" },
      { status },
    );
  }
}
