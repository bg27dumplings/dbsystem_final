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
