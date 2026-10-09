import { proxyToBackend } from "@/lib/api-route";

export async function GET() {
  return proxyToBackend({
    method: "get",
    path: "/v1/Tags",
    errorMessage: "Failed to fetch tags",
  });
}
