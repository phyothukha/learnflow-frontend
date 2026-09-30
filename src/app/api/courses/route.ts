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
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? "";
  const isPublished = searchParams.get("isPublished");

  const params = new URLSearchParams();
  params.set("page", String(page + 1));
  params.set("pageSize", String(limit));
  if (search) params.set("search", search);
  if (isPublished === "true" || isPublished === "false")
    params.set("isPublished", isPublished);

  try {
    const { data } = await serverAxios.get(`/v1/Courses?${params}`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json(
      { message: "Failed to fetch courses" },
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
    const { data } = await serverAxios.post("/v1/Courses", body, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json(
      { message: "Failed to create course" },
      { status },
    );
  }
}
