import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { serverAxios } from "@/lib/axios";
import { isAxiosError } from "axios";

interface RouteParams {
  id: string;
  attachmentId: string;
}

interface Params {
  params: Promise<RouteParams>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id, attachmentId } = await params;

  try {
    await serverAxios.delete(
      `/v1/Documents/${id}/attachments/${attachmentId}`,
      { headers: { Authorization: `Bearer ${session.user.accessToken}` } },
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json(
      { message: "Failed to delete attachment" },
      { status },
    );
  }
}
