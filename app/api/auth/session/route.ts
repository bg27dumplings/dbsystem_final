import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";

export async function GET() {
  const session = await getStudentSession();
  return NextResponse.json({
    authenticated: Boolean(session),
    student: session
  });
}
