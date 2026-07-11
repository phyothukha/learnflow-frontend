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
  const search = searchParams.get("search") ?? "";
  const topicId = searchParams.get("topicId");
  const documentId = searchParams.get("documentId");
  const expand = searchParams.get("expand") ?? undefined;
  const orderby = searchParams.get("orderby") ?? "UpdatedAt desc";

  const filters: string[] = [];
  if (search)
    filters.push(
      `contains(tolower(Title), '${search.toLowerCase().replace(/'/g, "''")}')`,
    );
  if (topicId) filters.push(`TopicId eq ${topicId}`);
  if (documentId) filters.push(`DocumentId eq ${documentId}`);

  const query = buildQuery({
    page,
    limit,
    expand,
    orderby,
    filter: filters.length ? filters.join(" and ") : undefined,
  });

  try {
    const { data } = await serverAxios.get(`/v1/Notes?${query}`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json({ message: "Failed to fetch notes" }, { status });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  try {
    const { data } = await serverAxios.post("/v1/Notes", body, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json({ message: "Failed to create note" }, { status });
  }
}
