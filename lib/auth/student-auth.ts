import "server-only";
import { findDemoStudent, verifyDemoStudentPassword } from "@/lib/auth/demo-students";

export function validateStudentIdFormat(studentId: string) {
  return /^S\d{6}$/i.test(studentId.trim());
}

export function authenticateStudent(studentId: string, password: string) {
  const normalizedStudentId = studentId.trim().toUpperCase();
  const student = findDemoStudent(normalizedStudentId);

  if (!student) {
    return { ok: false as const, reason: "credentials" as const };
  }

  if (student.status !== "active") {
    return { ok: false as const, reason: "frozen" as const };
  }

  const verifiedStudent = verifyDemoStudentPassword(normalizedStudentId, password);
  if (!verifiedStudent) {
    return { ok: false as const, reason: "credentials" as const };
  }

  return {
    ok: true as const,
    student: {
      studentId: verifiedStudent.studentId,
      studentNo: verifiedStudent.studentNo,
      name: verifiedStudent.name,
      status: verifiedStudent.status
    }
  };
}
