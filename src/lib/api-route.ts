import { NextResponse, type NextRequest } from "next/server";
import { isAxiosError, type AxiosRequestConfig } from "axios";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { serverAxios } from "@/lib/axios";

/**
 * Shared plumbing for the API gateway routes in `app/api/*`:
 * session check → backend call with the user's bearer token → error mapping.
 */

export function unauthorized() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function authHeaders(session: Session) {
  return { Authorization: `Bearer ${session.user.accessToken}` };
}

/** Mirrors the backend status and forwards its `message` when it sends one. */
export function backendError(error: unknown, fallbackMessage: string) {
  if (!isAxiosError(error))
    return NextResponse.json({ message: fallbackMessage }, { status: 500 });

  const status = error.response?.status ?? 500;
  const message = error.response?.data?.message ?? fallbackMessage;
  return NextResponse.json({ message }, { status });
}

interface ProxyOptions {
  method: "get" | "post" | "patch" | "delete";
  path: string;
  errorMessage: string;
  /** Incoming request whose JSON body is forwarded (POST/PATCH). Read only after the session check. */
  request?: NextRequest;
  /** Status returned on success. `204` responds with an empty body. */
  status?: number;
  headers?: AxiosRequestConfig["headers"];
}

export async function proxyToBackend({
  method,
  path,
  errorMessage,
  request,
  status = 200,
  headers,
}: ProxyOptions) {
  const session = await auth();
  if (!session) return unauthorized();

  const body = request ? await request.json() : undefined;

  try {
    const { data } = await serverAxios.request({
      method,
      url: path,
      data: body,
      headers: { ...authHeaders(session), ...headers },
    });
    if (status === 204) return new NextResponse(null, { status });
    return NextResponse.json(data, { status });
  } catch (error) {
    return backendError(error, errorMessage);
  }
}

/** Converts the UI's 0-indexed `page`/`limit` into the backend's 1-indexed `page`/`pageSize`. */
export function pagingParams(request: NextRequest, defaultLimit: number) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") ?? 0);
  const limit = Number(searchParams.get("limit") ?? defaultLimit);

  const params = new URLSearchParams();
  params.set("page", String(page + 1));
  params.set("pageSize", String(limit));
  return params;
}
