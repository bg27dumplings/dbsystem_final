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
