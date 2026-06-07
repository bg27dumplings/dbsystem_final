import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import { AppointmentSummary, ChatRoomDetail, ChatRoomSummary, MarketplaceItem } from "@/lib/marketplace/types";

type ItemRow = RowDataPacket & {
  id: number;
  title: string;
  description: string;
  exchange_note: string;
  condition_label: string;
  location: string;
  original_price: number;
  sale_price: number | null;
  status: MarketplaceItem["status"];
  category_name: string;
  seller_name: string;
  image_url: string | null;
};

type ItemImageRow = RowDataPacket & {
  public_url: string;
};

type AppointmentRow = RowDataPacket & {
  id: number;
  meetup_at: Date | string;
  location: string;
  amount: number;
  status: AppointmentSummary["status"];
  item_title: string;
  buyer_name: string;
  seller_name: string;
};

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

function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const formatter = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return formatter.format(date).replace(/\//g, "-");
}

function mapItem(row: ItemRow, images: string[] = []): MarketplaceItem {
  return {
    id: String(row.id),
    title: row.title,
    category: row.category_name,
    condition: row.condition_label,
    location: row.location,
    seller: row.seller_name,
    status: row.status,
    originalPrice: Number(row.original_price),
    salePrice: row.sale_price === null ? undefined : Number(row.sale_price),
    exchangeNote: row.exchange_note,
    description: row.description,
    images
  };
}

async function loadImagesByItemIds(itemIds: number[]) {
  if (itemIds.length === 0) {
    return new Map<number, string[]>();
  }

  const pool = getDbPool();
  const placeholders = itemIds.map(() => "?").join(", ");
  const [rows] = await pool.query<(ItemImageRow & { item_id: number })[]>(
    `SELECT item_id, public_url
     FROM item_images
     WHERE item_id IN (${placeholders})
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    itemIds
  );

  const imagesMap = new Map<number, string[]>();
  for (const row of rows) {
    const current = imagesMap.get(row.item_id) ?? [];
    current.push(row.public_url);
    imagesMap.set(row.item_id, current);
  }

  return imagesMap;
}

export async function findPublicItems() {
  const pool = getDbPool();
  const [rows] = await pool.query<ItemRow[]>(
    `SELECT i.id, i.title, i.description, i.exchange_note, i.condition_label, i.location,
            i.original_price, i.sale_price, i.status, c.name AS category_name,
            s.name AS seller_name, img.public_url AS image_url
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN students s ON s.id = i.student_id
     LEFT JOIN item_images img ON img.item_id = i.id AND img.is_primary = 1
     WHERE i.status IN ('active', 'reserved') AND s.status = 'active'
     ORDER BY i.created_at DESC`
  );

  const imageMap = await loadImagesByItemIds(rows.map((row) => row.id));
  return rows.map((row) => mapItem(row, imageMap.get(row.id) ?? (row.image_url ? [row.image_url] : [])));
}

export async function findItemById(itemId: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemRow[]>(
    `SELECT i.id, i.title, i.description, i.exchange_note, i.condition_label, i.location,
            i.original_price, i.sale_price, i.status, c.name AS category_name,
            s.name AS seller_name, img.public_url AS image_url
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN students s ON s.id = i.student_id
     LEFT JOIN item_images img ON img.item_id = i.id AND img.is_primary = 1
     WHERE i.id = ? AND i.status IN ('active', 'reserved') AND s.status = 'active'
     LIMIT 1`,
    [itemId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const imageMap = await loadImagesByItemIds([row.id]);
  return mapItem(row, imageMap.get(row.id) ?? (row.image_url ? [row.image_url] : []));
}

export async function findItemsByStudentId(studentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemRow[]>(
    `SELECT i.id, i.title, i.description, i.exchange_note, i.condition_label, i.location,
            i.original_price, i.sale_price, i.status, c.name AS category_name,
            s.name AS seller_name, img.public_url AS image_url
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN students s ON s.id = i.student_id
     LEFT JOIN item_images img ON img.item_id = i.id AND img.is_primary = 1
     WHERE i.student_id = ? AND i.status <> 'deleted'
     ORDER BY i.created_at DESC`,
    [studentId]
  );

  const imageMap = await loadImagesByItemIds(rows.map((row) => row.id));
  return rows.map((row) => mapItem(row, imageMap.get(row.id) ?? (row.image_url ? [row.image_url] : [])));
}

export async function findOwnedItemById(studentId: number, itemId: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<ItemRow[]>(
    `SELECT i.id, i.title, i.description, i.exchange_note, i.condition_label, i.location,
            i.original_price, i.sale_price, i.status, c.name AS category_name,
            s.name AS seller_name, img.public_url AS image_url
     FROM items i
     JOIN categories c ON c.id = i.category_id
     JOIN students s ON s.id = i.student_id
     LEFT JOIN item_images img ON img.item_id = i.id AND img.is_primary = 1
     WHERE i.id = ? AND i.student_id = ? AND i.status <> 'deleted'
     LIMIT 1`,
    [itemId, studentId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const imageMap = await loadImagesByItemIds([row.id]);
  return mapItem(row, imageMap.get(row.id) ?? (row.image_url ? [row.image_url] : []));
}

export async function findAppointmentsByStudentId(studentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<AppointmentRow[]>(
    `SELECT a.id, a.meetup_at, a.location, a.amount, a.status,
            i.title AS item_title,
            buyer.name AS buyer_name,
            seller.name AS seller_name
     FROM appointments a
     JOIN items i ON i.id = a.item_id
     JOIN students buyer ON buyer.id = a.buyer_id
     JOIN students seller ON seller.id = a.seller_id
     WHERE a.buyer_id = ? OR a.seller_id = ?
     ORDER BY a.meetup_at DESC`,
    [studentId, studentId]
  );

  return rows.map((row) => ({
    id: String(row.id),
    itemTitle: row.item_title,
    buyer: row.buyer_name,
    seller: row.seller_name,
    time: formatDateTime(row.meetup_at),
    location: row.location,
    amount: Number(row.amount),
    status: row.status
  }));
}

export async function findAppointmentByIdForStudent(studentId: number, appointmentId: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<AppointmentRow[]>(
    `SELECT a.id, a.meetup_at, a.location, a.amount, a.status,
            i.title AS item_title,
            buyer.name AS buyer_name,
            seller.name AS seller_name
     FROM appointments a
     JOIN items i ON i.id = a.item_id
     JOIN students buyer ON buyer.id = a.buyer_id
     JOIN students seller ON seller.id = a.seller_id
     WHERE a.id = ? AND (a.buyer_id = ? OR a.seller_id = ?)
     LIMIT 1`,
    [appointmentId, studentId, studentId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    itemTitle: row.item_title,
    buyer: row.buyer_name,
    seller: row.seller_name,
    time: formatDateTime(row.meetup_at),
    location: row.location,
    amount: Number(row.amount),
    status: row.status
  };
}

export async function findChatRoomsByStudentId(studentId: number) {
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

  return rows.map((row) => ({
    id: String(row.id),
    itemTitle: row.item_title,
    counterpartName: row.counterpart_name,
    lastMessage: row.last_message?.trim() || "目前尚無訊息。"
  })) satisfies ChatRoomSummary[];
}

export async function findChatRoomByIdForStudent(studentId: number, roomId: string) {
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

  return {
    roomId: String(room.id),
    itemTitle: room.item_title,
    messages: messageRows.map((row) => ({
      id: String(row.id),
      body: row.body,
      time: formatDateTime(row.created_at),
      isMine: row.sender_id === studentId,
      messageType: row.message_type
    }))
  } satisfies ChatRoomDetail;
}
