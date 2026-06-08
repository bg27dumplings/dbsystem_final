import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import type { AppointmentSummary } from "@/lib/marketplace/domain/models";
import { mapAppointmentSummary } from "@/lib/marketplace/domain/mappers";

type AppointmentRow = RowDataPacket & {
  id: number;
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
};

const SELECT_APPOINTMENT_FIELDS = `SELECT a.id, a.meetup_at, a.location, a.amount, a.exchange_mode, a.exchange_value, a.note, a.status,
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
