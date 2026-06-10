import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import type { AppointmentSummary } from "@/lib/marketplace/domain/models";
import { mapAppointmentSummary } from "@/lib/marketplace/domain/mappers";

type AppointmentRow = RowDataPacket & {
  id: number;
  item_id: number;
  buyer_id: number;
  seller_id: number;
  meetup_at: Date | string;
  location: string;
  amount: number;
  exchange_mode: string | null;
  exchange_value: string | null;
  note: string | null;
  status: AppointmentSummary["status"];
  item_title: string;
  buyer_name: string;
  buyer_avatar_url: string | null;
  seller_name: string;
  seller_avatar_url: string | null;
};

export type AppointmentRecord = {
  id: number;
  itemId: number;
  buyerId: number;
  sellerId: number;
  status: AppointmentSummary["status"];
  meetupAt: Date | string;
  location: string;
  itemTitle: string;
  buyerName: string;
  buyerAvatarUrl?: string;
  sellerName: string;
  sellerAvatarUrl?: string;
};

const SELECT_APPOINTMENT_FIELDS = `SELECT a.id, a.item_id, a.buyer_id, a.seller_id, a.meetup_at, a.location, a.location_x, a.location_y, a.amount, a.exchange_mode, a.exchange_value, a.note, a.status, a.buyer_unread, a.seller_unread,
        i.title AS item_title,
        buyer.name AS buyer_name,
        buyer.avatar_url AS buyer_avatar_url,
        seller.name AS seller_name,
        seller.avatar_url AS seller_avatar_url,
        img.public_url AS image_url
 FROM appointments a
 JOIN items i ON i.id = a.item_id
 JOIN students buyer ON buyer.id = a.buyer_id
 JOIN students seller ON seller.id = a.seller_id
 LEFT JOIN item_images img ON img.item_id = a.item_id AND img.is_primary = 1`;

function mapAppointmentRecord(row: AppointmentRow): AppointmentRecord {
  return {
    id: row.id,
    itemId: row.item_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    status: row.status,
    meetupAt: row.meetup_at,
    location: row.location,
    itemTitle: row.item_title,
    buyerName: row.buyer_name,
    buyerAvatarUrl: row.buyer_avatar_url ?? undefined,
    sellerName: row.seller_name,
    sellerAvatarUrl: row.seller_avatar_url ?? undefined
  };
}

export async function findStudentAppointments(studentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<AppointmentRow[]>(
    `${SELECT_APPOINTMENT_FIELDS}
     WHERE a.buyer_id = ? OR a.seller_id = ?
     ORDER BY a.updated_at DESC`,
    [studentId, studentId]
  );

  return rows.map((row) => mapAppointmentSummary(row, studentId));
}

export async function findStudentAppointmentById(studentId: number, appointmentId: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<AppointmentRow[]>(
    `${SELECT_APPOINTMENT_FIELDS}
     WHERE a.id = ? AND (a.buyer_id = ? OR a.seller_id = ?)
     LIMIT 1`,
    [appointmentId, studentId, studentId]
  );

  const row = rows[0];
  if (!row) return null;

  if (row.buyer_id === studentId && row.buyer_unread === 1) {
    await pool.execute(`UPDATE appointments SET buyer_unread = 0 WHERE id = ?`, [appointmentId]);
  } else if (row.seller_id === studentId && row.seller_unread === 1) {
    await pool.execute(`UPDATE appointments SET seller_unread = 0 WHERE id = ?`, [appointmentId]);
  }

  return mapAppointmentSummary(row, studentId);
}

export async function findAppointmentRecordById(appointmentId: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<AppointmentRow[]>(
    `${SELECT_APPOINTMENT_FIELDS}
     WHERE a.id = ?
     LIMIT 1`,
    [appointmentId]
  );

  const row = rows[0];
  return row ? mapAppointmentRecord(row) : null;
}

export async function countActiveAppointmentsForItem(itemId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total
     FROM appointments
     WHERE item_id = ? AND status = 'accepted'`,
    [itemId]
  );

  return Number(rows[0]?.total ?? 0);
}

export async function countPendingAppointmentsForStudent(studentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total
     FROM appointments
     WHERE (buyer_id = ? OR seller_id = ?) AND status = 'pending'`,
    [studentId, studentId]
  );

  return Number(rows[0]?.total ?? 0);
}

export async function hasPendingAppointmentForBuyerItem(itemId: number, buyerId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total
     FROM appointments
     WHERE item_id = ? AND buyer_id = ? AND status IN ('pending', 'accepted')`,
    [itemId, buyerId]
  );

  return Number(rows[0]?.total ?? 0) > 0;
}

export async function countUnreadAppointments(studentId: number): Promise<number> {
  const pool = getDbPool();
  const [rows] = await pool.execute<(RowDataPacket & { count: number })[]>(
    `SELECT COUNT(*) AS count
     FROM appointments
     WHERE (buyer_id = ? AND buyer_unread = 1) OR (seller_id = ? AND seller_unread = 1)`,
    [studentId, studentId]
  );

  return rows[0]?.count ?? 0;
}
