import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { serverAxios } from "@/lib/axios";
import { authHeaders, backendError, unauthorized } from "@/lib/api-route";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return unauthorized();

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
      // Let axios set the multipart boundary instead of the default JSON header.
      { headers: { ...authHeaders(session), "Content-Type": undefined } },
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return backendError(error, "Failed to upload attachment");
  }
}
