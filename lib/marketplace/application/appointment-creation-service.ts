import "server-only";
import { revalidatePath } from "next/cache";
import { getDbPool } from "@/lib/db";
import { formatDateTime } from "@/lib/marketplace/domain/mappers";
import { buildExchangeDescriptor, normalizeExchangeMode } from "@/lib/marketplace/domain/exchange";
import { countAcceptedAppointmentsForItem } from "@/lib/marketplace/application/item-availability-service";
import { hasPendingAppointmentForBuyerItem } from "@/lib/marketplace/infrastructure/appointment-repository";
import { insertAppointment } from "@/lib/marketplace/infrastructure/appointment-write-repository";
import { findOrCreateChatRoom, insertSystemChatMessage } from "@/lib/marketplace/infrastructure/chat-write-repository";
import { findMarketplaceItemActionContext } from "@/lib/marketplace/infrastructure/item-repository";

export type CreateAppointmentFieldErrors = {
  itemId?: string;
  meetupAt?: string;
  location?: string;
  locationX?: string;
  locationY?: string;
  exchangeMode?: string;
  exchangeValue?: string;
  note?: string;
};

export type CreateAppointmentResult =
  | { ok: true; appointmentId: string }
  | { ok: false; formError: string; fieldErrors: CreateAppointmentFieldErrors };

function formatDateTimeForDb(value: Date) {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  const hh = String(value.getHours()).padStart(2, "0");
  const mi = String(value.getMinutes()).padStart(2, "0");
  const ss = String(value.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function validateExchange(exchangeMode: string, exchangeValue: string) {
  const normalizedExchangeMode = normalizeExchangeMode(exchangeMode);
  if (!normalizedExchangeMode) {
    return {
      ok: false as const,
      fieldErrors: { exchangeMode: "請選擇有效的交換方式。" }
    };
  }

  const descriptor = buildExchangeDescriptor(normalizedExchangeMode, exchangeValue);
  if (!descriptor) {
    return {
      ok: false as const,
      fieldErrors: {
        exchangeValue: normalizedExchangeMode === "price" ? "請輸入有效價格。" : "請補充交換內容。"
      }
    };
  }

  return {
    ok: true as const,
    exchangeMode: normalizedExchangeMode,
    exchangeValue: descriptor.exchangeValue ?? null,
    amount: normalizedExchangeMode === "price" ? Number(descriptor.exchangeValue) : 0
  };
}

export async function createAppointment(input: {
  itemId: string;
  studentId: number;
  meetupAt: string;
  location: string;
  locationX: string;
  locationY: string;
  exchangeMode: string;
  exchangeValue: string;
  note: string;
}): Promise<CreateAppointmentResult> {
  const fieldErrors: CreateAppointmentFieldErrors = {};
  const itemId = input.itemId.trim();
  const meetupAt = input.meetupAt.trim();
  const location = input.location.trim();
  const note = input.note.trim();

  if (!itemId) {
    fieldErrors.itemId = "缺少物品資訊。";
  }

  const item = itemId ? await findMarketplaceItemActionContext(itemId) : null;
  if (!item) {
    fieldErrors.itemId = "找不到這筆物品，或物品目前無法預約。";
  } else {
    if (item.sellerId === input.studentId) {
      fieldErrors.itemId = "不能對自己的物品提出面交。";
    } else if (item.status !== "active") {
      fieldErrors.itemId = "這筆物品目前無法建立新面交。";
    } else {
      const acceptedCount = await countAcceptedAppointmentsForItem(Number(item.id));
      if (acceptedCount >= item.quantity) {
        fieldErrors.itemId = "這筆物品的預約名額已滿。";
      } else if (await hasPendingAppointmentForBuyerItem(Number(item.id), input.studentId)) {
        fieldErrors.itemId = "你已經對這筆物品提出過面交預約。";
      }
    }
  }

  if (!meetupAt) {
    fieldErrors.meetupAt = "請選擇面交時間。";
  }

  const meetupDate = meetupAt ? new Date(meetupAt) : null;
  if (meetupAt && (!meetupDate || Number.isNaN(meetupDate.getTime()))) {
    fieldErrors.meetupAt = "請選擇有效的面交時間。";
  }

  if (!location) {
    fieldErrors.location = "請輸入面交地點。";
  }

  const exchange = validateExchange(input.exchangeMode.trim(), input.exchangeValue);
  if (!exchange.ok) {
    Object.assign(fieldErrors, exchange.fieldErrors);
  }

  if (note.length > 500) {
    fieldErrors.note = "備註請控制在 500 字內。";
  }

  if (Object.keys(fieldErrors).length > 0 || !item || !meetupDate || !exchange.ok) {
    return {
      ok: false,
      formError: "請先修正欄位內容。",
      fieldErrors
    };
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const appointmentId = await insertAppointment(connection, {
      itemId: Number(item.id),
      buyerId: input.studentId,
      sellerId: item.sellerId,
      meetupAt: formatDateTimeForDb(meetupDate),
      location,
      locationX: input.locationX.trim() ? Number(input.locationX) : null,
      locationY: input.locationY.trim() ? Number(input.locationY) : null,
      amount: exchange.amount,
      exchangeMode: exchange.exchangeMode,
      exchangeValue: exchange.exchangeValue,
      note: note || null
    });

    const roomId = await findOrCreateChatRoom(connection, {
      itemId: Number(item.id),
      buyerId: input.studentId,
      sellerId: item.sellerId
    });

    await insertSystemChatMessage(connection, {
      roomId,
      body: `買家提出了面交預約「${item.title}」。時間：${formatDateTime(meetupDate)}，地點：${location}。請至「我的預約」查看並回覆。`
    });

    await connection.commit();

    revalidatePath("/me/appointments");
    revalidatePath(`/me/appointments/${appointmentId}`);
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${appointmentId}`);
    revalidatePath("/chat");
    revalidatePath(`/chat/${roomId}`);

    return {
      ok: true,
      appointmentId: String(appointmentId)
    };
  } catch {
    await connection.rollback();
    return {
      ok: false,
      formError: "面交建立失敗，請稍後再試。",
      fieldErrors: {}
    };
  } finally {
    connection.release();
  }
}
