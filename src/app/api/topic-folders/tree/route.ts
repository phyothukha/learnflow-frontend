import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { serverAxios } from "@/lib/axios";
import { isAxiosError } from "axios";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const topicId = request.nextUrl.searchParams.get("topicId");
  if (!topicId)
    return NextResponse.json(
      { message: "topicId is required" },
      { status: 400 },
    );

  try {
    const { data } = await serverAxios.get(
      `/v1/TopicFolders/tree?topicId=${topicId}`,
      { headers: { Authorization: `Bearer ${session.user.accessToken}` } },
    );
    return NextResponse.json(data);
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json(
      { message: "Failed to fetch folder tree" },
      { status },
    );
  }
}
