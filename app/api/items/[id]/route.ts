import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { updateMarketplaceItem } from "@/lib/marketplace/application/item-update-service";
import type { CreateMarketplaceItemFieldErrors } from "@/lib/marketplace/domain/create-item";
import { getDbPool } from "@/lib/db";
import { findOwnedMarketplaceItemById } from "@/lib/marketplace/infrastructure/item-repository";

type UpdateItemResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: CreateMarketplaceItemFieldErrors;
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<UpdateItemResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const images = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);

  const result = await updateMarketplaceItem({
    itemId: id,
    studentId: session.studentId,
    title: String(formData.get("title") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    conditionLabel: String(formData.get("conditionLabel") ?? ""),
    location: String(formData.get("location") ?? ""),
    quantity: String(formData.get("quantity") ?? "1"),
    locationX: String(formData.get("locationX") ?? ""),
    locationY: String(formData.get("locationY") ?? ""),
    exchangeMode: String(formData.get("exchangeMode") ?? ""),
    exchangeValue: String(formData.get("exchangeValue") ?? ""),
    description: String(formData.get("description") ?? ""),
    images
  });

  if (!result.ok) {
    return NextResponse.json<UpdateItemResponse>({
      ok: false,
      formError: result.formError,
      fieldErrors: result.fieldErrors
    }, { status: 400 });
  }

  return NextResponse.json<UpdateItemResponse>({
    ok: true,
    redirectTo: `/me/items?updated=1`
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json({ ok: false, formError: "請先登入有效的學生帳號。" }, { status: 401 });
  }

  const { id } = await context.params;
  const itemId = Number(id);

  if (isNaN(itemId)) {
    return NextResponse.json({ ok: false, formError: "無效的物品 ID。" }, { status: 400 });
  }

  const pool = getDbPool();
  try {
    const [rows] = await pool.execute<(import("mysql2").RowDataPacket & { student_id: number; status: string })[]>(
      `SELECT student_id, status FROM items WHERE id = ? LIMIT 1`,
      [itemId]
    );

    const item = rows[0];
    if (!item || item.student_id !== session.studentId) {
      return NextResponse.json({ ok: false, formError: "找不到這筆物品，或你沒有權限刪除。" }, { status: 404 });
    }

    if (["reserved", "completed", "violation_removed"].includes(item.status)) {
      return NextResponse.json({ ok: false, formError: "這筆物品的狀態目前無法刪除。" }, { status: 400 });
    }

    await pool.execute(
      `UPDATE items SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [itemId]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, formError: "系統忙碌中，請稍後再試。" }, { status: 500 });
  }
}
