import "server-only";
import { cookies } from "next/headers";
import { STUDENT_SESSION_COOKIE, STUDENT_SESSION_TTL_SECONDS } from "@/lib/auth/constants";
import { signPayload, verifyPayload } from "@/lib/auth/signing";
import { StudentSession } from "@/lib/auth/types";

type SessionCookiePayload = StudentSession & {
  expiresAt: number;
};

function getSessionSecret() {
  return process.env.STUDENT_SESSION_SECRET || "dev-student-session-secret";
}

export async function createStudentSession(session: StudentSession) {
  const cookieStore = await cookies();
  const payload: SessionCookiePayload = {
    ...session,
    expiresAt: Date.now() + STUDENT_SESSION_TTL_SECONDS * 1000
  };

  cookieStore.set(STUDENT_SESSION_COOKIE, signPayload(payload, getSessionSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STUDENT_SESSION_TTL_SECONDS
  });
}

export async function getStudentSession() {
  const cookieStore = await cookies();
  const payload = verifyPayload<SessionCookiePayload>(cookieStore.get(STUDENT_SESSION_COOKIE)?.value, getSessionSecret());

  if (!payload || payload.expiresAt < Date.now()) {
    return null;
  }

  return {
    studentId: payload.studentId,
    studentNo: payload.studentNo,
    name: payload.name,
    status: payload.status
  } satisfies StudentSession;
}

export async function clearStudentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_SESSION_COOKIE);
}
