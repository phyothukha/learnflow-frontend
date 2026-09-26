import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { serverAxios } from "@/lib/axios";
import { isAxiosError } from "axios";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  try {
    const { data } = await serverAxios.post(
      `/v1/TopicFolders/${id}/move`,
      body,
      { headers: { Authorization: `Bearer ${session.user.accessToken}` } },
    );
    return NextResponse.json(data);
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    const message = isAxiosError(error)
      ? (error.response?.data?.message ?? "Failed to move folder")
      : "Failed to move folder";
    return NextResponse.json({ message }, { status });
  }
}
