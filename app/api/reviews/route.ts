import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { submitReview } from "@/lib/marketplace/application/review-service";

type ReviewResponse = {
  ok: boolean;
  formError?: string;
  fieldErrors?: { rating?: string; comment?: string };
};

export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<ReviewResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const body = (await request.json()) as {
    appointmentId?: string;
    rating?: number;
    comment?: string;
  };

  const result = await submitReview({
    appointmentId: body.appointmentId ?? "",
    studentId: session.studentId,
    rating: Number(body.rating),
    comment: body.comment ?? ""
  });

  if (!result.ok) {
    return NextResponse.json<ReviewResponse>({
      ok: false,
      formError: result.formError,
      fieldErrors: result.fieldErrors
    }, { status: 400 });
  }

  return NextResponse.json<ReviewResponse>({ ok: true });
}
