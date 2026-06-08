import "server-only";
import type mysql from "mysql2/promise";

export async function findOrCreateChatRoom(
  connection: mysql.PoolConnection,
  input: {
    itemId: number;
    buyerId: number;
    sellerId: number;
  }
) {
  const [result] = await connection.execute<mysql.ResultSetHeader>(
    `INSERT INTO chat_rooms (item_id, buyer_id, seller_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), updated_at = updated_at`,
    [input.itemId, input.buyerId, input.sellerId]
  );

  return result.insertId;
}

export async function insertChatMessage(
  connection: mysql.PoolConnection,
  input: {
    roomId: number;
    senderId: number;
    body: string;
  }
) {
  const [result] = await connection.execute<mysql.ResultSetHeader>(
    `INSERT INTO chat_messages (room_id, sender_id, message_type, body)
     VALUES (?, ?, 'text', ?)`,
    [input.roomId, input.senderId, input.body]
  );

  await connection.execute(
    `UPDATE chat_rooms
     SET updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.roomId]
  );

  return result.insertId;
}
