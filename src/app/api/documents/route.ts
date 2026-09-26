import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { serverAxios } from "@/lib/axios";
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
  const folderId = searchParams.get("folderId");
  const status = searchParams.get("status");
  const tag = searchParams.get("tag");

  const params = new URLSearchParams();
  params.set("page", String(page + 1));
  params.set("pageSize", String(limit));
  if (search) params.set("search", search);
  if (topicId) params.set("topicId", topicId);
  if (folderId) params.set("folderId", folderId);
  if (status) params.set("status", status);
  if (tag) params.set("tag", tag);

  try {
    const { data } = await serverAxios.get(`/v1/Documents?${params}`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json(
      { message: "Failed to fetch documents" },
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
    const { data } = await serverAxios.post("/v1/Documents", body, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json(
      { message: "Failed to create document" },
      { status },
    );
  }
}
