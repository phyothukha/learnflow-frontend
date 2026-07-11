import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { serverAxios } from "@/lib/axios";
import { isAxiosError } from "axios";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { data } = await serverAxios.get(`/v1/Courses(${id})`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status ?? 500 : 500;
    return NextResponse.json({ message: "Failed to fetch course" }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  try {
    const { data } = await serverAxios.patch(`/v1/Courses(${id})`, body, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status ?? 500 : 500;
    return NextResponse.json({ message: "Failed to update course" }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await serverAxios.delete(`/v1/Courses(${id})`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status ?? 500 : 500;
    return NextResponse.json({ message: "Failed to delete course" }, { status });
  }
}
