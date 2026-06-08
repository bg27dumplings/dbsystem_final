import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { createAppointmentReview } from "@/lib/marketplace/application/appointment-management-service";

type CreateAppointmentReviewResponse = {
  ok: boolean;
  formError?: string;
  fieldErrors?: {
    rating?: string;
    comment?: string;
  };
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<CreateAppointmentReviewResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { rating?: string; comment?: string };
  const result = await createAppointmentReview({
    appointmentId: id,
    studentId: session.studentId,
    rating: body.rating ?? "",
    comment: body.comment ?? ""
  });

  return NextResponse.json<CreateAppointmentReviewResponse>(result, { status: result.ok ? 200 : 400 });
}
