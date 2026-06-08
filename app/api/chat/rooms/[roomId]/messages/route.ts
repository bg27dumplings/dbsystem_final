import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { sendChatMessage } from "@/lib/marketplace/application/chat-service";
import { findChatRoomByIdForStudent } from "@/lib/marketplace/queries";

type SendChatMessageResponse = {
  ok: boolean;
  formError?: string;
  fieldErrors?: {
    body?: string;
  };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json({ ok: false, formError: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await params;
  const room = await findChatRoomByIdForStudent(session.studentId, roomId);
  if (!room) {
    return NextResponse.json({ ok: false, formError: "NotFound" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, messages: room.messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<SendChatMessageResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const { roomId } = await params;
  const body = (await request.json()) as { body?: string };
  const result = await sendChatMessage({
    roomId,
    studentId: session.studentId,
    body: body.body ?? ""
  });

  if (!result.ok) {
    return NextResponse.json<SendChatMessageResponse>({
      ok: false,
      formError: result.formError,
      fieldErrors: result.fieldErrors
    }, { status: 400 });
  }

  return NextResponse.json<SendChatMessageResponse>({
    ok: true
  });
}
