import "server-only";
import { revalidatePath } from "next/cache";
import { getDbPool } from "@/lib/db";
import { findStudentAppointmentDetailById } from "@/lib/marketplace/infrastructure/appointment-repository";
import { updateMarketplaceItemStatus } from "@/lib/marketplace/infrastructure/item-write-repository";
import {
  insertAppointmentReview,
  updateAppointmentStatus
} from "@/lib/marketplace/infrastructure/appointment-write-repository";

export type AppointmentStatusAction = "accept" | "reject" | "cancel" | "complete" | "fail";

export type ChangeAppointmentStatusResult =
  | { ok: true }
  | { ok: false; formError: string };

export type CreateAppointmentReviewResult =
  | { ok: true }
  | { ok: false; formError: string; fieldErrors?: { rating?: string; comment?: string } };

const STATUS_RULES: Record<
  AppointmentStatusAction,
  {
    nextStatus: "accepted" | "rejected" | "cancelled" | "completed" | "failed";
    itemNextStatus: "reserved" | "active" | "removed" | null;
    requiresCurrentStatus: Array<"pending" | "accepted">;
    actor: "seller" | "buyer" | "either";
    setCompletedAt?: boolean;
  }
> = {
  accept: {
    nextStatus: "accepted",
    itemNextStatus: "reserved",
    requiresCurrentStatus: ["pending"],
    actor: "seller"
  },
  reject: {
    nextStatus: "rejected",
    itemNextStatus: "active",
    requiresCurrentStatus: ["pending"],
    actor: "seller"
  },
  cancel: {
    nextStatus: "cancelled",
    itemNextStatus: "active",
    requiresCurrentStatus: ["pending", "accepted"],
    actor: "buyer"
  },
  complete: {
    nextStatus: "completed",
    itemNextStatus: "removed",
    requiresCurrentStatus: ["accepted"],
    actor: "either",
    setCompletedAt: true
  },
  fail: {
    nextStatus: "failed",
    itemNextStatus: "active",
    requiresCurrentStatus: ["accepted"],
    actor: "either"
  }
};

export async function changeAppointmentStatus(input: {
  appointmentId: string;
  studentId: number;
  action: AppointmentStatusAction;
}): Promise<ChangeAppointmentStatusResult> {
  const appointment = await findStudentAppointmentDetailById(input.studentId, input.appointmentId);
  if (!appointment) {
    return { ok: false, formError: "找不到這筆預約，或你目前沒有權限操作。" };
  }

  const rule = STATUS_RULES[input.action];
  if (!(rule.requiresCurrentStatus as string[]).includes(appointment.status)) {
    return { ok: false, formError: "這筆預約目前無法執行這個操作。" };
  }

  if (input.action === "accept" && appointment.itemStatus !== "active") {
    return { ok: false, formError: "這件物品目前無法再接受新的預約。" };
  }

  const actorAllowed =
    rule.actor === "either"
      ? appointment.isBuyer || appointment.isSeller
      : rule.actor === "buyer"
        ? appointment.isBuyer
        : appointment.isSeller;

  if (!actorAllowed) {
    return { ok: false, formError: "你目前沒有權限執行這個操作。" };
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await updateAppointmentStatus(connection, {
      appointmentId: Number(appointment.id),
      nextStatus: rule.nextStatus,
      setCompletedAt: rule.setCompletedAt
    });

    if (rule.itemNextStatus) {
      const nextItemStatus = input.action === "cancel" && appointment.status === "pending"
        ? "active"
        : rule.itemNextStatus;
      await updateMarketplaceItemStatus(connection, {
        itemId: Number(appointment.itemId),
        studentId: Number(appointment.sellerId),
        nextStatus: nextItemStatus
      });
    }

    await connection.commit();

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath(`/items/${appointment.itemId}`);
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${appointment.id}`);
    revalidatePath("/me/items");

    return { ok: true };
  } catch {
    await connection.rollback();
    return { ok: false, formError: "預約狀態更新失敗，請稍後再試。" };
  } finally {
    connection.release();
  }
}

export async function createAppointmentReview(input: {
  appointmentId: string;
  studentId: number;
  rating: string;
  comment: string;
}): Promise<CreateAppointmentReviewResult> {
  const appointment = await findStudentAppointmentDetailById(input.studentId, input.appointmentId);
  if (!appointment) {
    return { ok: false, formError: "找不到這筆預約，或你目前沒有權限評價。" };
  }

  if (appointment.status !== "completed") {
    return { ok: false, formError: "只有已完成的預約才能留下評價。" };
  }

  if (!appointment.canReview) {
    return { ok: false, formError: appointment.hasReviewed ? "你已經提交過這筆交易的評價。" : "你目前不能對這筆交易評價。" };
  }

  const parsedRating = Number(input.rating);
  const trimmedComment = input.comment.trim();
  const fieldErrors: { rating?: string; comment?: string } = {};

  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    fieldErrors.rating = "請選擇 1 到 5 分。";
  }

  if (!trimmedComment) {
    fieldErrors.comment = "請輸入評價內容。";
  } else if (trimmedComment.length > 1000) {
    fieldErrors.comment = "評價內容請控制在 1000 字內。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      formError: "請先修正欄位內容。",
      fieldErrors
    };
  }

  const revieweeId = appointment.isBuyer ? Number(appointment.sellerId) : Number(appointment.buyerId);
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await insertAppointmentReview(connection, {
      appointmentId: Number(appointment.id),
      reviewerId: input.studentId,
      revieweeId,
      rating: parsedRating,
      comment: trimmedComment
    });
    await connection.commit();

    revalidatePath(`/appointments/${appointment.id}`);

    return { ok: true };
  } catch (error) {
    await connection.rollback();

    const duplicateReview = typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
    const message = duplicateReview
      ? "你已經提交過這筆交易的評價。"
      : "評價送出失敗，請稍後再試。";

    return {
      ok: false,
      formError: message
    };
  } finally {
    connection.release();
  }
}
