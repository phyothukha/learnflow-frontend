import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-route";

interface Params {
  params: Promise<{ id: string; attachmentId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id, attachmentId } = await params;
  return proxyToBackend({
    method: "delete",
    path: `/v1/Documents/${id}/attachments/${attachmentId}`,
    status: 204,
    errorMessage: "Failed to delete attachment",
  });
}
