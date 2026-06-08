import "server-only";
import type mysql from "mysql2/promise";

export async function insertAppointment(
  connection: mysql.PoolConnection,
  input: {
    itemId: number;
    buyerId: number;
    sellerId: number;
    meetupAt: string;
    location: string;
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
      amount,
      exchange_mode,
      exchange_value,
      note,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      input.itemId,
      input.buyerId,
      input.sellerId,
      input.meetupAt,
      input.location,
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
  input: {
    appointmentId: number;
    nextStatus: "accepted" | "rejected" | "cancelled" | "completed" | "failed";
    setCompletedAt?: boolean;
  }
) {
  await connection.execute(
    `UPDATE appointments
     SET status = ?,
         completed_at = ${input.setCompletedAt ? "CURRENT_TIMESTAMP" : "NULL"}
     WHERE id = ?`,
    [input.nextStatus, input.appointmentId]
  );
}

export async function insertAppointmentReview(
  connection: mysql.PoolConnection,
  input: {
    appointmentId: number;
    reviewerId: number;
    revieweeId: number;
    rating: number;
    comment: string;
  }
) {
  const [result] = await connection.execute<mysql.ResultSetHeader>(
    `INSERT INTO reviews (
      appointment_id,
      reviewer_id,
      reviewee_id,
      rating,
      comment,
      status
    ) VALUES (?, ?, ?, ?, ?, 'visible')`,
    [input.appointmentId, input.reviewerId, input.revieweeId, input.rating, input.comment]
  );

  return result.insertId;
}
