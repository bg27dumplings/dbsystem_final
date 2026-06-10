import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getStudentSession } from "@/lib/auth/student-session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ ok: false, error: "Invalid item ID" }, { status: 400 });
    }

    const session = await getStudentSession();
    if (!session || session.status !== "active") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const pool = getDbPool();

    // Check if the item exists and is active
    const [items] = await pool.execute<any[]>(
      `SELECT id FROM items WHERE id = ? AND status = 'active'`,
      [itemId]
    );

    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: "Item not found or not active" }, { status: 404 });
    }

    // Check if already in wishlist
    const [wishlists] = await pool.execute<any[]>(
      `SELECT * FROM wishlists WHERE student_id = ? AND item_id = ?`,
      [session.studentId, itemId]
    );

    let isWished = false;
    if (wishlists.length > 0) {
      // Remove from wishlist
      await pool.execute(
        `DELETE FROM wishlists WHERE student_id = ? AND item_id = ?`,
        [session.studentId, itemId]
      );
    } else {
      // Add to wishlist
      await pool.execute(
        `INSERT INTO wishlists (student_id, item_id) VALUES (?, ?)`,
        [session.studentId, itemId]
      );
      isWished = true;
    }

    return NextResponse.json({ ok: true, isWished });
  } catch (error) {
    console.error("Wishlist toggle error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
