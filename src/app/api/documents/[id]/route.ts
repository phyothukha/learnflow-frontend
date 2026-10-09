import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-route";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend({
    method: "get",
    path: `/v1/Documents/${id}`,
    errorMessage: "Failed to fetch document",
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend({
    method: "patch",
    path: `/v1/Documents/${id}`,
    request,
    errorMessage: "Failed to update document",
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend({
    method: "delete",
    path: `/v1/Documents/${id}`,
    status: 204,
    errorMessage: "Failed to delete document",
  });
}
