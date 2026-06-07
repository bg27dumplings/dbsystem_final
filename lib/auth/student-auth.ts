import "server-only";
import { compare } from "bcryptjs";
import { findStudentByStudentNo } from "@/lib/auth/student-repository";

export function validateStudentIdFormat(studentId: string) {
  const normalizedStudentId = studentId.trim().toUpperCase();
  const match = /^([A-Z]{3})(\d{3})(\d{3})$/.exec(normalizedStudentId);
  if (!match) {
    return false;
  }

  const enrollmentYear = Number(match[2]);
  const currentRocYear = new Date().getFullYear() - 1911;

  return enrollmentYear >= 1 && enrollmentYear <= currentRocYear + 1;
}

export async function authenticateStudent(studentId: string, password: string) {
  const normalizedStudentId = studentId.trim().toUpperCase();
  const student = await findStudentByStudentNo(normalizedStudentId);

  if (!student) {
    return { ok: false as const, reason: "credentials" as const };
  }

  if (student.status === "deleted") {
    return { ok: false as const, reason: "deleted" as const };
  }

  if (student.status !== "active") {
    return { ok: false as const, reason: "frozen" as const };
  }

  const verified = await compare(password, student.passwordHash);
  if (!verified) {
    return { ok: false as const, reason: "credentials" as const };
  }

  return {
    ok: true as const,
    student: {
      studentId: student.studentId,
      studentNo: student.studentNo,
      name: student.name,
      status: student.status
    }
  };
}
