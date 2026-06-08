import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { changeAppointmentStatus } from "@/lib/marketplace/application/appointment-management-service";

type AppointmentActionResponse = {
  ok: boolean;
  formError?: string;
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<AppointmentActionResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const { id } = await params;
  const result = await changeAppointmentStatus({
    appointmentId: id,
    studentId: session.studentId,
    action: "complete"
  });

  return NextResponse.json<AppointmentActionResponse>(result, { status: result.ok ? 200 : 400 });
}
