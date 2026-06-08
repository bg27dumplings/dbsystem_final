import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { getDbPool } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json({ ok: false, formError: "請先登入。" }, { status: 401 });
  }

  try {
    const { messageId } = await params;
    const bodyJson = await request.json();
    const newBody = bodyJson.body?.trim();

    if (!newBody) {
      return NextResponse.json({ ok: false, formError: "訊息內容不能為空。" }, { status: 400 });
    }

    const pool = getDbPool();
    // Update only if sender matches session student
    const [result] = await pool.execute(
      `UPDATE chat_messages SET body = ?, is_edited = 1 WHERE id = ? AND sender_id = ?`,
      [newBody, messageId, session.studentId]
    );

    const affected = (result as any).affectedRows;
    if (affected === 0) {
      return NextResponse.json({ ok: false, formError: "無權編輯此訊息，或訊息不存在。" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to edit chat message:", error);
    return NextResponse.json({ ok: false, formError: "伺服器錯誤，編輯失敗。" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json({ ok: false, formError: "請先登入。" }, { status: 401 });
  }

  try {
    const { messageId } = await params;
    const pool = getDbPool();

    // Soft update message to recalled type instead of hard deleting
    const [result] = await pool.execute(
      `UPDATE chat_messages SET message_type = 'recalled', body = '訊息已收回' WHERE id = ? AND sender_id = ?`,
      [messageId, session.studentId]
    );

    const affected = (result as any).affectedRows;
    if (affected === 0) {
      return NextResponse.json({ ok: false, formError: "無權收回此訊息，或訊息不存在。" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to recall chat message:", error);
    return NextResponse.json({ ok: false, formError: "伺服器錯誤，收回失敗。" }, { status: 500 });
  }
}
