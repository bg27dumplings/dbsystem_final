import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import type { PendingReview, StudentRatingSummary } from "@/lib/marketplace/domain/models";
import { formatDateTime } from "@/lib/marketplace/domain/mappers";

export async function findStudentRatingSummary(studentId: number): Promise<StudentRatingSummary> {
  const pool = getDbPool();
  const [rows] = await pool.execute<(RowDataPacket & { avg_rating: number | null; review_count: number })[]>(
    `SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count
     FROM reviews
     WHERE reviewee_id = ? AND status = 'visible'`,
    [studentId]
  );

  const row = rows[0];
  return {
    averageRating: row?.avg_rating === null ? 0 : Number(Number(row.avg_rating).toFixed(1)),
    reviewCount: Number(row?.review_count ?? 0)
  };
}

export async function findPendingReviewsForStudent(studentId: number): Promise<PendingReview[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<
    (RowDataPacket & {
      appointment_id: number;
      item_title: string;
      counterpart_name: string;
      completed_at: Date | string | null;
    })[]
  >(
    `SELECT a.id AS appointment_id, i.title AS item_title,
            CASE WHEN a.buyer_id = ? THEN seller.name ELSE buyer.name END AS counterpart_name,
            a.completed_at
     FROM appointments a
     JOIN items i ON i.id = a.item_id
     JOIN students buyer ON buyer.id = a.buyer_id
     JOIN students seller ON seller.id = a.seller_id
     LEFT JOIN reviews r ON r.appointment_id = a.id AND r.reviewer_id = ?
     WHERE a.status = 'completed' AND r.id IS NULL AND (a.buyer_id = ? OR a.seller_id = ?)
     ORDER BY a.completed_at DESC`,
    [studentId, studentId, studentId, studentId]
  );

  return rows.map((row) => ({
    appointmentId: String(row.appointment_id),
    itemTitle: row.item_title,
    counterpartName: row.counterpart_name,
    completedAt: row.completed_at ? formatDateTime(row.completed_at) : "已完成"
  }));
}

export async function hasReviewForAppointment(appointmentId: number, reviewerId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total
     FROM reviews
     WHERE appointment_id = ? AND reviewer_id = ?`,
    [appointmentId, reviewerId]
  );

  return Number(rows[0]?.total ?? 0) > 0;
}

export async function insertReview(input: {
  appointmentId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string;
}) {
  const pool = getDbPool();
  await pool.execute(
    `INSERT INTO reviews (appointment_id, reviewer_id, reviewee_id, rating, comment, status)
     VALUES (?, ?, ?, ?, ?, 'visible')`,
    [input.appointmentId, input.reviewerId, input.revieweeId, input.rating, input.comment]
  );
}

export type StudentReview = {
  id: number;
  rating: number;
  comment: string;
  reviewerName: string;
  itemTitle: string;
  role: "buyer" | "seller";
  createdAt: string;
};

export async function findReviewsForStudent(studentId: number): Promise<StudentReview[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<
    (import("mysql2").RowDataPacket & {
      id: number;
      rating: number;
      comment: string;
      reviewer_name: string;
      item_title: string;
      buyer_id: number;
      seller_id: number;
      created_at: Date;
    })[]
  >(
    `SELECT r.id, r.rating, r.comment, s.name AS reviewer_name, i.title AS item_title, a.buyer_id, a.seller_id, r.created_at
     FROM reviews r
     JOIN students s ON s.id = r.reviewer_id
     JOIN appointments a ON a.id = r.appointment_id
     JOIN items i ON i.id = a.item_id
     WHERE r.reviewee_id = ? AND r.status = 'visible'
     ORDER BY r.created_at DESC`,
    [studentId]
  );

  return rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    reviewerName: row.reviewer_name,
    itemTitle: row.item_title,
    role: row.seller_id === studentId ? "seller" : "buyer",
    createdAt: row.created_at.toISOString()
  }));
}
