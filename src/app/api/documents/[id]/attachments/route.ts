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
  const incomingForm = await request.formData();
  const file = incomingForm.get("file");

  if (!(file instanceof Blob))
    return NextResponse.json({ message: "File is required" }, { status: 400 });

  const outgoingForm = new FormData();
  outgoingForm.set("file", file, (file as File).name ?? "upload");

  try {
    const { data } = await serverAxios.post(
      `/v1/Documents/${id}/attachments`,
      outgoingForm,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": undefined,
        },
      },
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const status = isAxiosError(error) ? (error.response?.status ?? 500) : 500;
    return NextResponse.json(
      { message: "Failed to upload attachment" },
      { status },
    );
  }
}
