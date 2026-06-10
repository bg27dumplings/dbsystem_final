import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import { mapChatRoomSummary } from "@/lib/marketplace/domain/mappers";

type ChatRoomRow = RowDataPacket & {
  id: number;
  item_title: string;
  counterpart_name: string;
  counterpart_avatar_url: string | null;
  last_message: string | null;
  is_seller: number;
  unread_count: number;
};

type ChatMessageRow = RowDataPacket & {
  id: number;
  body: string;
  created_at: Date | string;
  sender_id: number | null;
  message_type: string;
  is_edited: number;
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
            CASE WHEN cr.buyer_id = ? THEN seller.avatar_url ELSE buyer.avatar_url END AS counterpart_avatar_url,
            CASE WHEN cr.seller_id = ? THEN 1 ELSE 0 END AS is_seller,
            (
              SELECT COUNT(*)
              FROM chat_messages cm
              WHERE cm.room_id = cr.id
                AND cm.sender_id <> ?
                AND cm.is_read = 0
                AND cm.message_type <> 'recalled'
            ) AS unread_count,
            (
              SELECT CASE WHEN cm.message_type = 'recalled' THEN '訊息已收回' ELSE cm.body END
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
    [studentId, studentId, studentId, studentId, studentId, studentId]
  );

  return rows.map(mapChatRoomSummary);
}

export async function findStudentChatRoomById(studentId: number, roomId: string) {
  const pool = getDbPool();

  // Mark all unread messages from counterpart as read when viewing the room
  await pool.execute(
    `UPDATE chat_messages
     SET is_read = 1
     WHERE room_id = ? AND sender_id <> ? AND is_read = 0 AND message_type <> 'recalled'`,
    [roomId, studentId]
  );

  const [roomRows] = await pool.execute<(RowDataPacket & { id: string; item_id: number; item_title: string; counterpart_name: string; counterpart_avatar_url: string | null })[]>(
    `SELECT cr.id, cr.item_id, i.title AS item_title,
            CASE WHEN cr.buyer_id = ? THEN seller.name ELSE buyer.name END AS counterpart_name,
            CASE WHEN cr.buyer_id = ? THEN seller.avatar_url ELSE buyer.avatar_url END AS counterpart_avatar_url
     FROM chat_rooms cr
     JOIN items i ON i.id = cr.item_id
     JOIN students buyer ON buyer.id = cr.buyer_id
     JOIN students seller ON seller.id = cr.seller_id
     WHERE cr.id = ? AND (cr.buyer_id = ? OR cr.seller_id = ?)
     LIMIT 1`,
    [studentId, studentId, roomId, studentId, studentId]
  );

  const room = roomRows[0];
  if (!room) {
    return null;
  }

  const [messageRows] = await pool.execute<ChatMessageRow[]>(
    `SELECT id, body, created_at, sender_id, message_type, is_edited
     FROM chat_messages
     WHERE room_id = ?
     ORDER BY created_at ASC, id ASC`,
    [roomId]
  );

  return {
    roomId: String(room.id),
    itemId: room.item_id,
    itemTitle: room.item_title,
    counterpartName: room.counterpart_name,
    counterpartAvatarUrl: room.counterpart_avatar_url ?? undefined,
    studentId,
    messages: messageRows.map((row) => {
      const dateObj = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const hh = String(dateObj.getHours()).padStart(2, "0");
      const min = String(dateObj.getMinutes()).padStart(2, "0");

      return {
        id: String(row.id),
        body: row.body,
        time: `${yyyy}-${mm}-${dd} ${hh}:${min}`,
        isMine: row.sender_id === studentId,
        messageType: row.message_type
      };
    })
  };
}

export async function countUnreadChatMessages(studentId: number): Promise<number> {
  const pool = getDbPool();
  const [rows] = await pool.execute<(RowDataPacket & { count: number })[]>(
    `SELECT COUNT(*) AS count
     FROM chat_messages cm
     JOIN chat_rooms cr ON cr.id = cm.room_id
     WHERE (cr.buyer_id = ? OR cr.seller_id = ?)
       AND cm.sender_id <> ?
       AND cm.is_read = 0
       AND cm.message_type <> 'recalled'`,
    [studentId, studentId, studentId]
  );

  return rows[0]?.count ?? 0;
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
