import "server-only";
import { revalidatePath } from "next/cache";
import { getDbPool } from "@/lib/db";
import { findOrCreateChatRoom, insertSystemChatMessage } from "@/lib/marketplace/infrastructure/chat-write-repository";
import { updateAppointmentStatus } from "@/lib/marketplace/infrastructure/appointment-write-repository";

export async function cancelPendingAppointmentsAfterItemEdit(itemId: number, itemTitle: string) {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<
      (import("mysql2").RowDataPacket & {
        id: number;
        buyer_id: number;
        seller_id: number;
      })[]
    >(
      `SELECT id, buyer_id, seller_id
       FROM appointments
       WHERE item_id = ? AND status = 'pending'`,
      [itemId]
    );

    for (const row of rows) {
      await updateAppointmentStatus(connection, { appointmentId: row.id, nextStatus: "cancelled" });

      const roomId = await findOrCreateChatRoom(connection, {
        itemId,
        buyerId: row.buyer_id,
        sellerId: row.seller_id
      });

      await insertSystemChatMessage(connection, {
        roomId,
        body: `賣家已更新物品「${itemTitle}」的內容，因此系統已自動取消這筆待回覆的面交預約。請重新確認物品資訊後再提出新的預約。`
      });
    }

    await connection.commit();

    revalidatePath("/me/appointments");
    revalidatePath("/me/chat");
  } catch {
    await connection.rollback();
  } finally {
    connection.release();
  }
}
