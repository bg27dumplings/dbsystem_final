import "server-only";
import type mysql from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import { updateItemStatus } from "@/lib/marketplace/infrastructure/appointment-write-repository";

export async function countAcceptedAppointmentsForItem(itemId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<(import("mysql2").RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total
     FROM appointments
     WHERE item_id = ? AND status = 'accepted'`,
    [itemId]
  );

  return Number(rows[0]?.total ?? 0);
}

export async function getItemQuantity(itemId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<(import("mysql2").RowDataPacket & { quantity: number; status: string })[]>(
    `SELECT quantity, status
     FROM items
     WHERE id = ?
     LIMIT 1`,
    [itemId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    quantity: Number(row.quantity),
    status: row.status
  };
}

export async function syncItemVisibility(connection: mysql.PoolConnection, itemId: number) {
  const [rows] = await connection.execute<(import("mysql2").RowDataPacket & { quantity: number; status: string })[]>(
    `SELECT quantity, status
     FROM items
     WHERE id = ?
     LIMIT 1`,
    [itemId]
  );

  const item = rows[0];
  if (!item || item.status === "removed" || item.status === "deleted" || item.status === "violation_removed") {
    return;
  }

  const [acceptedRows] = await connection.execute<(import("mysql2").RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total
     FROM appointments
     WHERE item_id = ? AND status = 'accepted'`,
    [itemId]
  );

  const acceptedCount = Number(acceptedRows[0]?.total ?? 0);
  const quantity = Number(item.quantity);

  if (acceptedCount >= quantity) {
    await updateItemStatus(connection, itemId, "hidden");
    return;
  }

  if (item.status === "hidden" || item.status === "reserved") {
    await updateItemStatus(connection, itemId, "active");
  }
}

export async function rejectRemainingPendingWhenFull(connection: mysql.PoolConnection, itemId: number) {
  const [rows] = await connection.execute<(import("mysql2").RowDataPacket & { quantity: number })[]>(
    `SELECT quantity FROM items WHERE id = ? LIMIT 1`,
    [itemId]
  );

  const quantity = Number(rows[0]?.quantity ?? 1);
  const [acceptedRows] = await connection.execute<(import("mysql2").RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM appointments WHERE item_id = ? AND status = 'accepted'`,
    [itemId]
  );

  const acceptedCount = Number(acceptedRows[0]?.total ?? 0);
  if (acceptedCount < quantity) {
    return;
  }

  await connection.execute(
    `UPDATE appointments
     SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
     WHERE item_id = ? AND status = 'pending'`,
    [itemId]
  );
}

export async function markItemsCompletedWhenFullyCompleted(connection: mysql.PoolConnection) {
  await connection.execute(
    `UPDATE items i
     SET i.status = 'completed', i.updated_at = CURRENT_TIMESTAMP
     WHERE i.status IN ('active', 'hidden', 'reserved')
       AND i.quantity <= (
         SELECT COUNT(*)
         FROM appointments a
         WHERE a.item_id = i.id AND a.status IN ('evaluating', 'completed')
       )
       AND NOT EXISTS (
         SELECT 1
         FROM appointments a
         WHERE a.item_id = i.id AND a.status IN ('accepted', 'pending')
       )`
  );
}
