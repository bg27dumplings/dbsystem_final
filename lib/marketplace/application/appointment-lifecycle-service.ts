import "server-only";
import { revalidatePath } from "next/cache";
import { getDbPool } from "@/lib/db";
import { formatDateTime } from "@/lib/marketplace/domain/mappers";
import { findAppointmentRecordById } from "@/lib/marketplace/infrastructure/appointment-repository";
import {
  markItemsCompletedWhenFullyCompleted,
  rejectRemainingPendingWhenFull,
  syncItemVisibility
} from "@/lib/marketplace/application/item-availability-service";
import {
  completeExpiredAcceptedAppointments,
  updateAppointmentStatus
} from "@/lib/marketplace/infrastructure/appointment-write-repository";
import { findOrCreateChatRoom, insertSystemChatMessage } from "@/lib/marketplace/infrastructure/chat-write-repository";

export type AppointmentActionResult =
  | { ok: true }
  | { ok: false; formError: string };

async function notifyParticipants(
  connection: Parameters<typeof findOrCreateChatRoom>[0],
  input: {
    itemId: number;
    buyerId: number;
    sellerId: number;
    body: string;
  }
) {
  const roomId = await findOrCreateChatRoom(connection, {
    itemId: input.itemId,
    buyerId: input.buyerId,
    sellerId: input.sellerId
  });

  await insertSystemChatMessage(connection, {
    roomId,
    body: input.body
  });
}

export async function syncAppointmentLifecycle() {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [expiredRows] = await connection.execute<
      (import("mysql2").RowDataPacket & {
        id: number;
        item_id: number;
        buyer_id: number;
        seller_id: number;
        item_title: string;
      })[]
    >(
      `SELECT a.id, a.item_id, a.buyer_id, a.seller_id, i.title AS item_title
       FROM appointments a
       JOIN items i ON i.id = a.item_id
       WHERE a.status = 'accepted' AND a.meetup_at <= NOW()`
    );

    await completeExpiredAcceptedAppointments(connection);
    await markItemsCompletedWhenFullyCompleted(connection);

    const affectedItemIds = [...new Set(expiredRows.map((row) => row.item_id))];
    for (const itemId of affectedItemIds) {
      await syncItemVisibility(connection, itemId);
    }

    for (const row of expiredRows) {
      await notifyParticipants(connection, {
        itemId: row.item_id,
        buyerId: row.buyer_id,
        sellerId: row.seller_id,
        body: `面交預約「${row.item_title}」已於約定時間後自動標記為完成，歡迎為對方留下評價。`
      });
    }

    await connection.commit();
  } catch {
    await connection.rollback();
  } finally {
    connection.release();
  }
}

export async function acceptAppointment(input: {
  appointmentId: string;
  studentId: number;
}): Promise<AppointmentActionResult> {
  await syncAppointmentLifecycle();

  const appointment = await findAppointmentRecordById(input.appointmentId);
  if (!appointment) {
    return { ok: false, formError: "找不到這筆預約。" };
  }

  if (appointment.sellerId !== input.studentId) {
    return { ok: false, formError: "只有賣家可以同意面交預約。" };
  }

  if (appointment.status !== "pending") {
    return { ok: false, formError: "這筆預約目前無法同意。" };
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await updateAppointmentStatus(connection, { appointmentId: appointment.id, nextStatus: "accepted", triggerStudentId: input.studentId });
    await syncItemVisibility(connection, appointment.itemId);
    await rejectRemainingPendingWhenFull(connection, appointment.itemId);
    await notifyParticipants(connection, {
      itemId: appointment.itemId,
      buyerId: appointment.buyerId,
      sellerId: appointment.sellerId,
      body: `賣家已同意面交預約「${appointment.itemTitle}」。時間：${formatDateTime(appointment.meetupAt)}，地點：${appointment.location}。`
    });
    await connection.commit();

    revalidateAppointmentPaths(input.appointmentId);
    return { ok: true };
  } catch {
    await connection.rollback();
    return { ok: false, formError: "同意預約失敗，請稍後再試。" };
  } finally {
    connection.release();
  }
}

export async function rejectAppointment(input: {
  appointmentId: string;
  studentId: number;
}): Promise<AppointmentActionResult> {
  const appointment = await findAppointmentRecordById(input.appointmentId);
  if (!appointment) {
    return { ok: false, formError: "找不到這筆預約。" };
  }

  if (appointment.sellerId !== input.studentId) {
    return { ok: false, formError: "只有賣家可以拒絕面交預約。" };
  }

  if (appointment.status !== "pending") {
    return { ok: false, formError: "這筆預約目前無法拒絕。" };
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await updateAppointmentStatus(connection, { appointmentId: appointment.id, nextStatus: "rejected", triggerStudentId: input.studentId });
    await notifyParticipants(connection, {
      itemId: appointment.itemId,
      buyerId: appointment.buyerId,
      sellerId: appointment.sellerId,
      body: `賣家已拒絕面交預約「${appointment.itemTitle}」。`
    });
    await connection.commit();

    revalidateAppointmentPaths(input.appointmentId);
    return { ok: true };
  } catch {
    await connection.rollback();
    return { ok: false, formError: "拒絕預約失敗，請稍後再試。" };
  } finally {
    connection.release();
  }
}

export async function cancelAppointment(input: {
  appointmentId: string;
  studentId: number;
}): Promise<AppointmentActionResult> {
  const appointment = await findAppointmentRecordById(input.appointmentId);
  if (!appointment) {
    return { ok: false, formError: "找不到這筆預約。" };
  }

  if (appointment.buyerId !== input.studentId && appointment.sellerId !== input.studentId) {
    return { ok: false, formError: "你沒有權限取消這筆預約。" };
  }

  if (!["pending", "accepted"].includes(appointment.status)) {
    return { ok: false, formError: "這筆預約目前無法取消。" };
  }

  const actorLabel = appointment.buyerId === input.studentId ? "買家" : "賣家";
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await updateAppointmentStatus(connection, { appointmentId: appointment.id, nextStatus: "cancelled", triggerStudentId: input.studentId });

    if (appointment.status === "accepted") {
      await syncItemVisibility(connection, appointment.itemId);
    }

    await notifyParticipants(connection, {
      itemId: appointment.itemId,
      buyerId: appointment.buyerId,
      sellerId: appointment.sellerId,
      body: `${actorLabel}已取消面交預約「${appointment.itemTitle}」。`
    });
    await connection.commit();

    revalidateAppointmentPaths(input.appointmentId);
    return { ok: true };
  } catch {
    await connection.rollback();
    return { ok: false, formError: "取消預約失敗，請稍後再試。" };
  } finally {
    connection.release();
  }
}

function revalidateAppointmentPaths(appointmentId: string) {
  revalidatePath("/me");
  revalidatePath("/me/appointments");
  revalidatePath(`/me/appointments/${appointmentId}`);
  revalidatePath("/me/chat");
  revalidatePath("/me/items");
  revalidatePath("/");
  revalidatePath("/search");
}
