import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { openChatRoomForItem } from "@/lib/marketplace/application/chat-service";

type OpenChatRoomResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
};

export async function POST(request: Request) {
  const session = await getStudentSession();
  const body = (await request.json()) as { itemId?: string };
  const itemId = body.itemId?.trim() ?? "";

  if (!session || session.status !== "active") {
    return NextResponse.json<OpenChatRoomResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。",
      redirectTo: `/auth/login?returnTo=${encodeURIComponent(`/items/${itemId}`)}`
    }, { status: 401 });
  }

  const result = await openChatRoomForItem({
    itemId,
    studentId: session.studentId
  });

  if (!result.ok) {
    return NextResponse.json<OpenChatRoomResponse>({
      ok: false,
      formError: result.formError
    }, { status: 400 });
  }

  return NextResponse.json<OpenChatRoomResponse>({
    ok: true,
    redirectTo: `/chat/${result.roomId}`
  });
}
