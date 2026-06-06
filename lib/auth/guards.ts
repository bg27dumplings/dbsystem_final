import "server-only";
import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth/student-session";

export async function requireStudentSession(returnTo: string) {
  const session = await getStudentSession();
  if (!session) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (session.status !== "active") {
    redirect("/auth/login");
  }

  return session;
}
