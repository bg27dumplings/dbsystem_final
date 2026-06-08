import "server-only";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import { StudentSession, StudentStatus } from "@/lib/auth/types";

type StudentRow = RowDataPacket & {
  id: number;
  student_no: string;
  name: string;
  email: string;
  password_hash: string;
  status: string;
};

export type StudentRecord = {
  studentId: number;
  studentNo: string;
  name: string;
  email: string;
  passwordHash: string;
  status: StudentStatus | "deleted";
};

export type CreateStudentInput = {
  studentNo: string;
  name: string;
  email: string;
  passwordHash: string;
};

function mapStudent(row: StudentRow): StudentRecord {
  return {
    studentId: row.id,
    studentNo: row.student_no,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    status: row.status as StudentStatus | "deleted"
  };
}

export async function findStudentByStudentNo(studentNo: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<StudentRow[]>(
    `SELECT id, student_no, name, email, password_hash, status
     FROM students
     WHERE student_no = ?
     LIMIT 1`,
    [studentNo]
  );

  return rows[0] ? mapStudent(rows[0]) : null;
}

export async function findStudentByEmail(email: string) {
  const pool = getDbPool();
  const [rows] = await pool.execute<StudentRow[]>(
    `SELECT id, student_no, name, email, password_hash, status
     FROM students
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] ? mapStudent(rows[0]) : null;
}

export async function createStudent(input: CreateStudentInput): Promise<StudentSession> {
  const pool = getDbPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO students (student_no, name, email, password_hash, status)
     VALUES (?, ?, ?, ?, 'active')`,
    [input.studentNo, input.name, input.email, input.passwordHash]
  );

  return {
    studentId: result.insertId,
    studentNo: input.studentNo,
    name: input.name,
    status: "active"
  };
}

export async function findStudentById(id: number) {
  const pool = getDbPool();
  const [rows] = await pool.execute<StudentRow[]>(
    `SELECT id, student_no, name, email, password_hash, status
     FROM students
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ? mapStudent(rows[0]) : null;
}

export async function updateStudent(studentId: number, name: string, email: string, passwordHash?: string) {
  const pool = getDbPool();
  if (passwordHash) {
    await pool.execute(
      `UPDATE students SET name = ?, email = ?, password_hash = ? WHERE id = ?`,
      [name, email, passwordHash, studentId]
    );
  } else {
    await pool.execute(
      `UPDATE students SET name = ?, email = ? WHERE id = ?`,
      [name, email, studentId]
    );
  }
}

export type StudentStats = {
  totalDeals: number;
  avgRating: number | null;
  totalReviews: number;
};

export async function getStudentStats(studentId: number): Promise<StudentStats> {
  const pool = getDbPool();
  
  // 1. Get completed deals count
  const [dealRows] = await pool.execute<any[]>(
    `SELECT COUNT(*) as total_deals FROM appointments WHERE (buyer_id = ? OR seller_id = ?) AND status = 'completed'`,
    [studentId, studentId]
  );
  const totalDeals = Number(dealRows[0]?.total_deals ?? 0);

  // 2. Get reviews rating
  const [ratingRows] = await pool.execute<any[]>(
    `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE reviewee_id = ? AND status = 'visible'`,
    [studentId]
  );
  const avgRating = ratingRows[0]?.avg_rating !== null ? Number(Number(ratingRows[0].avg_rating).toFixed(1)) : null;
  const totalReviews = Number(ratingRows[0]?.total_reviews ?? 0);

  return { totalDeals, avgRating, totalReviews };
}
