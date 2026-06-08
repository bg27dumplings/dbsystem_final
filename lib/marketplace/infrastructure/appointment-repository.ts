import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import type { AppointmentDetail, AppointmentSummary, ItemStatus } from "@/lib/marketplace/domain/models";
import { mapAppointmentDetail, mapAppointmentReview, mapAppointmentSummary } from "@/lib/marketplace/domain/mappers";

type AppointmentRow = RowDataPacket & {
  id: number;
  item_id: number;
  item_status: ItemStatus;
  meetup_at: Date | string;
  location: string;
  amount: number;
  exchange_mode: string | null;
  exchange_value: string | null;
  note: string | null;
  status: AppointmentSummary["status"];
  item_title: string;
  buyer_name: string;
  seller_name: string;
  buyer_id: number;
  seller_id: number;
};

type AppointmentReviewRow = RowDataPacket & {
  id: number;
  reviewer_id: number;
  reviewer_name: string;
  reviewee_id: number;
  reviewee_name: string;
  rating: number;
  comment: string;
  status: string;
  created_at: Date | string;
};

const SELECT_APPOINTMENT_FIELDS = `SELECT a.id, a.item_id, i.status AS item_status, a.meetup_at, a.location, a.amount, a.exchange_mode, a.exchange_value, a.note, a.status,
        a.buyer_id, a.seller_id,
        i.title AS item_title,
        buyer.name AS buyer_name,
        seller.name AS seller_name
 FROM appointments a
 JOIN items i ON i.id = a.item_id
 JOIN students buyer ON buyer.id = a.buyer_id
 JOIN students seller ON seller.id = a.seller_id`;

export async function findStudentAppointments(studentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<AppointmentRow[]>(
    `${SELECT_APPOINTMENT_FIELDS}
     WHERE a.buyer_id = ? OR a.seller_id = ?
     ORDER BY a.meetup_at DESC`,
    [studentId, studentId]
  );

  return rows.map(mapAppointmentSummary);
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
  return row ? mapAppointmentSummary(row) : null;
}

export async function findStudentAppointmentDetailById(studentId: number, appointmentId: string): Promise<AppointmentDetail | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<AppointmentRow[]>(
    `${SELECT_APPOINTMENT_FIELDS}
     WHERE a.id = ? AND (a.buyer_id = ? OR a.seller_id = ?)
     LIMIT 1`,
    [appointmentId, studentId, studentId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const [reviewRows] = await pool.execute<AppointmentReviewRow[]>(
    `SELECT r.id, r.reviewer_id, reviewer.name AS reviewer_name, r.reviewee_id, reviewee.name AS reviewee_name,
            r.rating, r.comment, r.status, r.created_at
     FROM reviews r
     JOIN students reviewer ON reviewer.id = r.reviewer_id
     JOIN students reviewee ON reviewee.id = r.reviewee_id
     WHERE r.appointment_id = ?
     ORDER BY r.created_at ASC, r.id ASC`,
    [appointmentId]
  );

  return mapAppointmentDetail(row, studentId, reviewRows.map(mapAppointmentReview));
}
