import "server-only";
import { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import type { StudentProfile } from "@/lib/marketplace/domain/models";
import { findStudentRatingSummary } from "@/lib/marketplace/infrastructure/review-repository";

type StudentProfileRow = RowDataPacket & {
  name: string;
  student_no: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
};

export async function findStudentProfile(studentId: number): Promise<StudentProfile | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<StudentProfileRow[]>(
    `SELECT name, student_no, email, bio, avatar_url
     FROM students
     WHERE id = ? AND status = 'active'
     LIMIT 1`,
    [studentId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const rating = await findStudentRatingSummary(studentId);

  return {
    name: row.name,
    studentNo: row.student_no,
    email: row.email,
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? null,
    rating
  };
}

export async function updateStudentProfile(
  studentId: number,
  name: string,
  email: string,
  bio: string,
  avatarUrl: string | null
) {
  const pool = getDbPool();
  try {
    await pool.execute(
      `UPDATE students
       SET name = ?, email = ?, bio = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, email, bio, avatarUrl, studentId]
    );
    return { ok: true };
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return { ok: false, error: "email_taken" };
    }
    throw error;
  }
}

export async function findPublicStudentProfile(studentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<(RowDataPacket & { name: string; bio: string | null; avatar_url: string | null })[]>(
    `SELECT name, bio, avatar_url
     FROM students
     WHERE id = ? AND status = 'active'
     LIMIT 1`,
    [studentId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const rating = await findStudentRatingSummary(studentId);

  return {
    name: row.name,
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? null,
    rating
  };
}
