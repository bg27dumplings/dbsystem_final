import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import {
  acceptAppointment,
  cancelAppointment,
  rejectAppointment
} from "@/lib/marketplace/application/appointment-lifecycle-service";

type AppointmentActionResponse = {
  ok: boolean;
  formError?: string;
  redirectTo?: string;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<AppointmentActionResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { action?: string };
  const action = body.action?.trim();

  let result;
  if (action === "accept") {
    result = await acceptAppointment({ appointmentId: id, studentId: session.studentId });
  } else if (action === "reject") {
    result = await rejectAppointment({ appointmentId: id, studentId: session.studentId });
  } else if (action === "cancel") {
    result = await cancelAppointment({ appointmentId: id, studentId: session.studentId });
  } else {
    return NextResponse.json<AppointmentActionResponse>({
      ok: false,
      formError: "不支援的預約操作。"
    }, { status: 400 });
  }

  if (!result.ok) {
    return NextResponse.json<AppointmentActionResponse>({
      ok: false,
      formError: result.formError
    }, { status: 400 });
  }

  return NextResponse.json<AppointmentActionResponse>({
    ok: true,
    redirectTo: `/me/appointments/${id}`
  });
}
