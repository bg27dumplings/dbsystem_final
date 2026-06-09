import "server-only";
import { revalidatePath } from "next/cache";
import { findAppointmentRecordById } from "@/lib/marketplace/infrastructure/appointment-repository";
import {
  hasReviewForAppointment,
  insertReview
} from "@/lib/marketplace/infrastructure/review-repository";
import { syncAppointmentLifecycle } from "@/lib/marketplace/application/appointment-lifecycle-service";

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; formError: string; fieldErrors?: { rating?: string; comment?: string } };

export async function submitReview(input: {
  appointmentId: string;
  studentId: number;
  rating: number;
  comment: string;
}): Promise<SubmitReviewResult> {
  await syncAppointmentLifecycle();

  const appointment = await findAppointmentRecordById(input.appointmentId);
  if (!appointment) {
    return { ok: false, formError: "找不到這筆預約。" };
  }

  if (appointment.status !== "completed") {
    return { ok: false, formError: "這筆預約尚未完成，暫時無法評價。" };
  }

  if (appointment.buyerId !== input.studentId && appointment.sellerId !== input.studentId) {
    return { ok: false, formError: "你沒有權限評價這筆交易。" };
  }

  if (await hasReviewForAppointment(appointment.id, input.studentId)) {
    return { ok: false, formError: "你已經評價過這筆交易。" };
  }

  const fieldErrors: { rating?: string; comment?: string } = {};
  const rating = Number(input.rating);
  const comment = input.comment.trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    fieldErrors.rating = "請選擇 1 到 5 星。";
  }

  if (!comment) {
    fieldErrors.comment = "請輸入評價內容。";
  } else if (comment.length > 300) {
    fieldErrors.comment = "評價內容請控制在 300 字內。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      formError: "請先修正欄位內容。",
      fieldErrors
    };
  }

  const revieweeId =
    appointment.buyerId === input.studentId ? appointment.sellerId : appointment.buyerId;

  await insertReview({
    appointmentId: appointment.id,
    reviewerId: input.studentId,
    revieweeId,
    rating,
    comment
  });

  revalidatePath("/me");
  revalidatePath("/me/profile");
  revalidatePath(`/me/appointments/${input.appointmentId}`);
  revalidatePath(`/items/${appointment.itemId}`);

  return { ok: true };
}
