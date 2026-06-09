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
};

export async function findStudentProfile(studentId: number): Promise<StudentProfile | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<StudentProfileRow[]>(
    `SELECT name, student_no, email, bio
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
    rating
  };
}

export async function updateStudentBio(studentId: number, bio: string) {
  const pool = getDbPool();
  await pool.execute(
    `UPDATE students
     SET bio = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [bio, studentId]
  );
}

export async function findPublicStudentProfile(studentId: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<(RowDataPacket & { name: string; bio: string | null })[]>(
    `SELECT name, bio
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
    rating
  };
}
