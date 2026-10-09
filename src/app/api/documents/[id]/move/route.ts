import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-route";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend({
    method: "post",
    path: `/v1/Documents/${id}/move`,
    request,
    errorMessage: "Failed to move document",
  });
}
