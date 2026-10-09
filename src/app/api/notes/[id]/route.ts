import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-route";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend({
    method: "get",
    path: `/v1/Notes/${id}`,
    errorMessage: "Failed to fetch note",
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend({
    method: "patch",
    path: `/v1/Notes/${id}`,
    request,
    errorMessage: "Failed to update note",
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend({
    method: "delete",
    path: `/v1/Notes/${id}`,
    status: 204,
    errorMessage: "Failed to delete note",
  });
}
