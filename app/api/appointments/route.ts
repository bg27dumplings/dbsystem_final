import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import {
  createAppointment,
  type CreateAppointmentFieldErrors
} from "@/lib/marketplace/application/appointment-creation-service";

type CreateAppointmentResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: CreateAppointmentFieldErrors;
};

export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<CreateAppointmentResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const body = (await request.json()) as {
    itemId?: string;
    meetupAt?: string;
    location?: string;
    locationX?: string;
    locationY?: string;
    exchangeMode?: string;
    exchangeValue?: string;
    note?: string;
  };

  const result = await createAppointment({
    itemId: body.itemId ?? "",
    studentId: session.studentId,
    meetupAt: body.meetupAt ?? "",
    location: body.location ?? "",
    locationX: body.locationX ?? "",
    locationY: body.locationY ?? "",
    exchangeMode: body.exchangeMode ?? "",
    exchangeValue: body.exchangeValue ?? "",
    note: body.note ?? ""
  });

  if (!result.ok) {
    return NextResponse.json<CreateAppointmentResponse>({
      ok: false,
      formError: result.formError,
      fieldErrors: result.fieldErrors
    }, { status: 400 });
  }

  return NextResponse.json<CreateAppointmentResponse>({
    ok: true,
    redirectTo: `/me/appointments/${result.appointmentId}?created=1`
  });
}
