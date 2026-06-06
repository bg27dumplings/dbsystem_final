import { NextResponse } from "next/server";
import { clearStudentSession } from "@/lib/auth/student-session";

export async function POST() {
  await clearStudentSession();
  return NextResponse.json({ ok: true });
}
