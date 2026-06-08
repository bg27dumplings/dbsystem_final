import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import { mapChatRoomDetail, mapChatRoomSummary } from "@/lib/marketplace/domain/mappers";

type ChatRoomRow = RowDataPacket & {
  id: number;
  item_title: string;
  counterpart_name: string;
  last_message: string | null;
};

type ChatMessageRow = RowDataPacket & {
  id: number;
  body: string;
  created_at: Date | string;
  sender_id: number | null;
  message_type: string;
};

type ChatRoomParticipantRow = RowDataPacket & {
  id: number;
  item_id: number;
  buyer_id: number;
  seller_id: number;
};

export async function findStudentChatRooms(studentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<ChatRoomRow[]>(
    `SELECT cr.id, i.title AS item_title,
            CASE WHEN cr.buyer_id = ? THEN seller.name ELSE buyer.name END AS counterpart_name,
            (
              SELECT body
              FROM chat_messages cm
              WHERE cm.room_id = cr.id
              ORDER BY cm.created_at DESC, cm.id DESC
              LIMIT 1
            ) AS last_message
     FROM chat_rooms cr
     JOIN items i ON i.id = cr.item_id
     JOIN students buyer ON buyer.id = cr.buyer_id
     JOIN students seller ON seller.id = cr.seller_id
     WHERE cr.buyer_id = ? OR cr.seller_id = ?
     ORDER BY cr.updated_at DESC`,
    [studentId, studentId, studentId]
  );

  return rows.map(mapChatRoomSummary);
}

export async function findStudentChatRoomById(studentId: number, roomId: string) {
  const pool = getDbPool();
  const [roomRows] = await pool.execute<(RowDataPacket & { id: number; item_title: string })[]>(
    `SELECT cr.id, i.title AS item_title
     FROM chat_rooms cr
     JOIN items i ON i.id = cr.item_id
     WHERE cr.id = ? AND (cr.buyer_id = ? OR cr.seller_id = ?)
     LIMIT 1`,
    [roomId, studentId, studentId]
  );

  const room = roomRows[0];
  if (!room) {
    return null;
  }

  const [messageRows] = await pool.execute<ChatMessageRow[]>(
    `SELECT id, body, created_at, sender_id, message_type
     FROM chat_messages
     WHERE room_id = ?
     ORDER BY created_at ASC, id ASC`,
    [roomId]
  );

  return mapChatRoomDetail(room.id, room.item_title, studentId, messageRows);
}

export async function findChatRoomParticipantById(roomId: string | number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<ChatRoomParticipantRow[]>(
    `SELECT id, item_id, buyer_id, seller_id
     FROM chat_rooms
     WHERE id = ?
     LIMIT 1`,
    [roomId]
  );

  return rows[0] ?? null;
}
