import "server-only";
import { scryptSync, timingSafeEqual } from "crypto";
import { DemoStudentRecord } from "@/lib/auth/types";

function hashPassword(password: string) {
  return scryptSync(password, "campus-share-student-demo-salt", 64).toString("hex");
}

function isPasswordMatch(input: string, storedHash: string) {
  const inputBuffer = Buffer.from(hashPassword(input), "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  return inputBuffer.length === storedBuffer.length && timingSafeEqual(inputBuffer, storedBuffer);
}

const demoStudents: DemoStudentRecord[] = [
  {
    studentId: 1,
    studentNo: "S110001",
    name: "林同學",
    email: "s110001@campus.example",
    status: "active",
    passwordHash: hashPassword("Campus1234")
  },
  {
    studentId: 2,
    studentNo: "S110002",
    name: "陳同學",
    email: "s110002@campus.example",
    status: "active",
    passwordHash: hashPassword("Campus5678")
  },
  {
    studentId: 3,
    studentNo: "S110003",
    name: "王同學",
    email: "s110003@campus.example",
    status: "frozen",
    passwordHash: hashPassword("Campus9999")
  }
];

export function findDemoStudent(studentNo: string) {
  return demoStudents.find((student) => student.studentNo === studentNo.toUpperCase()) ?? null;
}

export function verifyDemoStudentPassword(studentNo: string, password: string) {
  const student = findDemoStudent(studentNo);
  if (!student) {
    return null;
  }

  return isPasswordMatch(password, student.passwordHash) ? student : null;
}
