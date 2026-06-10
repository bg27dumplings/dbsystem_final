import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { getDbPool } from "@/lib/db";
import { findOwnedMarketplaceItemById } from "@/lib/marketplace/infrastructure/item-repository";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json({ ok: false, formError: "請先登入有效的學生帳號。" }, { status: 401 });
  }

  const { id } = await context.params;
  const itemId = Number(id);

  if (isNaN(itemId)) {
    return NextResponse.json({ ok: false, formError: "無效的物品 ID。" }, { status: 400 });
  }

  const existingItem = await findOwnedMarketplaceItemById(session.studentId, String(itemId));
  if (!existingItem) {
    return NextResponse.json({ ok: false, formError: "找不到這筆物品，或你沒有權限編輯。" }, { status: 404 });
  }

  if (existingItem.status === "completed") {
    return NextResponse.json({ ok: false, formError: "交易已完成，無法修改狀態。" }, { status: 400 });
  }
  
  if (["removed", "violation_removed", "deleted"].includes(existingItem.status)) {
    return NextResponse.json({ ok: false, formError: "此物品已被移除或刪除，無法修改狀態。" }, { status: 400 });
  }

  let newStatus: string;
  try {
    const body = await request.json();
    if (body.status !== "active" && body.status !== "removed") {
      return NextResponse.json({ ok: false, formError: "無效的狀態值。" }, { status: 400 });
    }
    newStatus = body.status;
  } catch {
    return NextResponse.json({ ok: false, formError: "無效的請求格式。" }, { status: 400 });
  }

  const pool = getDbPool();
  try {
    await pool.execute(
      `UPDATE items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newStatus, itemId]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, formError: "系統忙碌中，請稍後再試。" }, { status: 500 });
  }
}
