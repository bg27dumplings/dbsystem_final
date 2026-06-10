import "server-only";
import { revalidatePath } from "next/cache";
import { getDbPool } from "@/lib/db";
import { findAppointmentRecordById } from "@/lib/marketplace/infrastructure/appointment-repository";
import { updateMarketplaceItemStatus } from "@/lib/marketplace/infrastructure/item-write-repository";
import { findMarketplaceItemById } from "@/lib/marketplace/infrastructure/item-repository";
import {
  updateAppointmentStatus
} from "@/lib/marketplace/infrastructure/appointment-write-repository";

export type AppointmentStatusAction = "accept" | "reject" | "cancel" | "complete" | "fail";

export type ChangeAppointmentStatusResult =
  | { ok: true }
  | { ok: false; formError: string };


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
  const appointment = await findAppointmentRecordById(input.appointmentId);
  if (!appointment || (appointment.buyerId !== input.studentId && appointment.sellerId !== input.studentId)) {
    return { ok: false, formError: "找不到這筆預約，或你目前沒有權限操作。" };
  }

  const isBuyer = appointment.buyerId === input.studentId;
  const isSeller = appointment.sellerId === input.studentId;

  const rule = STATUS_RULES[input.action];
  if (!(rule.requiresCurrentStatus as string[]).includes(appointment.status)) {
    return { ok: false, formError: "這筆預約目前無法執行這個操作。" };
  }

  if (input.action === "accept") {
    const item = await findMarketplaceItemById(String(appointment.itemId));
    if (!item || item.status !== "active") {
      return { ok: false, formError: "這件物品目前無法再接受新的預約。" };
    }
  }

  const actorAllowed =
    rule.actor === "either"
      ? isBuyer || isSeller
      : rule.actor === "buyer"
        ? isBuyer
        : isSeller;

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
    revalidatePath("/me/appointments");
    revalidatePath(`/me/appointments/${appointment.id}`);
    revalidatePath("/me/items");

    return { ok: true };
  } catch {
    await connection.rollback();
    return { ok: false, formError: "預約狀態更新失敗，請稍後再試。" };
  } finally {
    connection.release();
  }
}


