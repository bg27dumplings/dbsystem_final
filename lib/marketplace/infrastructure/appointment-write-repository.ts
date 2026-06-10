import "server-only";
import type mysql from "mysql2/promise";
import type { AppointmentStatus } from "@/lib/marketplace/domain/models";

export async function insertAppointment(
  connection: mysql.PoolConnection,
  input: {
    itemId: number;
    buyerId: number;
    sellerId: number;
    meetupAt: string;
    location: string;
    locationX: number | null;
    locationY: number | null;
    amount: number;
    exchangeMode: string;
    exchangeValue: string | null;
    note: string | null;
  }
) {
  const [result] = await connection.execute<mysql.ResultSetHeader>(
    `INSERT INTO appointments (
      item_id,
      buyer_id,
      seller_id,
      meetup_at,
      location,
      location_x,
      location_y,
      amount,
      exchange_mode,
      exchange_value,
      note,
      status,
      seller_unread
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)`,
    [
      input.itemId,
      input.buyerId,
      input.sellerId,
      input.meetupAt,
      input.location,
      input.locationX,
      input.locationY,
      input.amount,
      input.exchangeMode,
      input.exchangeValue,
      input.note
    ]
  );

  return result.insertId;
}

export async function updateAppointmentStatus(
  connection: mysql.PoolConnection,
  params: {
    appointmentId: number;
    nextStatus: AppointmentStatus;
    setCompletedAt?: boolean;
    triggerStudentId?: number;
  }
) {
  const completedAtValue = params.setCompletedAt ? "CURRENT_TIMESTAMP" : "completed_at";
  let query = `UPDATE appointments SET status = ?, completed_at = ${completedAtValue}, updated_at = CURRENT_TIMESTAMP`;
  const sqlParams: any[] = [params.nextStatus];

  if (params.triggerStudentId) {
    query += `, buyer_unread = CASE WHEN seller_id = ? THEN 1 ELSE buyer_unread END, seller_unread = CASE WHEN buyer_id = ? THEN 1 ELSE seller_unread END`;
    sqlParams.push(params.triggerStudentId, params.triggerStudentId);
  }

  query += ` WHERE id = ?`;
  sqlParams.push(params.appointmentId);

  await connection.execute(query, sqlParams);
}

export async function rejectOtherPendingAppointments(
  connection: mysql.PoolConnection,
  itemId: number,
  exceptAppointmentId: number
) {
  await connection.execute(
    `UPDATE appointments
     SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
     WHERE item_id = ? AND id <> ? AND status = 'pending'`,
    [itemId, exceptAppointmentId]
  );
}

export async function updateItemStatus(
  connection: mysql.PoolConnection,
  itemId: number,
  status: string
) {
  await connection.execute(
    `UPDATE items
     SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, itemId]
  );
}

export async function completeExpiredAcceptedAppointments(connection: mysql.PoolConnection) {
  const [result] = await connection.execute<mysql.ResultSetHeader>(
    `UPDATE appointments
     SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE status = 'accepted' AND meetup_at <= NOW()`
  );

  return result.affectedRows;
}

