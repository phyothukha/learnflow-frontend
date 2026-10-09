import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-route";
import { buildQuery } from "@/utils/query";
import { EnrollmentStatus } from "@/store/server/enrollments/interface";

const ENUM_TYPE = "learnflow_service.Models.EnrollmentStatus";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 10);
  const search = searchParams.get("search") ?? "";
  const expand = searchParams.get("expand") ?? "Course";
  const orderby = searchParams.get("orderby") ?? "CreatedAt desc";
  const statuses = (searchParams.get("status") ?? "")
    .split(",")
    .filter((status): status is EnrollmentStatus =>
      Object.values(EnrollmentStatus).includes(status as EnrollmentStatus),
    );

  const filters: string[] = [];
  if (search)
    filters.push(
      `contains(tolower(StudentName), '${search.toLowerCase().replace(/'/g, "''")}')`,
    );
  if (statuses.length)
    filters.push(
      `(${statuses.map((status) => `Status eq ${ENUM_TYPE}'${status}'`).join(" or ")})`,
    );

  const query = buildQuery({
    page,
    limit,
    expand,
    orderby,
    filter: filters.length ? filters.join(" and ") : undefined,
  });

  return proxyToBackend({
    method: "get",
    path: `/v1/Enrollments?${query}`,
    errorMessage: "Failed to fetch enrollments",
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend({
    method: "post",
    path: "/v1/Enrollments",
    request,
    status: 201,
    errorMessage: "Failed to create enrollment",
  });
}
