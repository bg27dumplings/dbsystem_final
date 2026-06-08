import "server-only";
import { revalidatePath } from "next/cache";
import { getDbPool } from "@/lib/db";
import { findChatRoomParticipantById } from "@/lib/marketplace/infrastructure/chat-repository";
import { findMarketplaceItemActionContext } from "@/lib/marketplace/infrastructure/item-repository";
import { findOrCreateChatRoom, insertChatMessage } from "@/lib/marketplace/infrastructure/chat-write-repository";

export type OpenChatRoomResult =
  | { ok: true; roomId: string }
  | { ok: false; formError: string };

export type SendChatMessageResult =
  | { ok: true }
  | { ok: false; formError: string; fieldErrors?: { body?: string } };

export async function openChatRoomForItem(input: {
  itemId: string;
  studentId: number;
}): Promise<OpenChatRoomResult> {
  const item = await findMarketplaceItemActionContext(input.itemId);
  if (!item) {
    return { ok: false, formError: "找不到這筆物品，或物品目前無法聯絡。" };
  }

  if (item.sellerId === input.studentId) {
    return { ok: false, formError: "不能對自己的物品建立聊天室。" };
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const roomId = await findOrCreateChatRoom(connection, {
      itemId: Number(item.id),
      buyerId: input.studentId,
      sellerId: item.sellerId
    });
    await connection.commit();

    revalidatePath("/chat");

    return {
      ok: true,
      roomId: String(roomId)
    };
  } catch {
    await connection.rollback();
    return { ok: false, formError: "聊天室建立失敗，請稍後再試。" };
  } finally {
    connection.release();
  }
}

export async function sendChatMessage(input: {
  roomId: string;
  studentId: number;
  body: string;
}): Promise<SendChatMessageResult> {
  const body = input.body.trim();
  if (!body) {
    return {
      ok: false,
      formError: "請先輸入訊息內容。",
      fieldErrors: { body: "請輸入訊息內容。" }
    };
  }

  const room = await findChatRoomParticipantById(input.roomId);
  if (!room || (room.buyer_id !== input.studentId && room.seller_id !== input.studentId)) {
    return { ok: false, formError: "你目前沒有權限在這個聊天室傳送訊息。" };
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await insertChatMessage(connection, {
      roomId: room.id,
      senderId: input.studentId,
      body
    });
    await connection.commit();

    revalidatePath("/chat");
    revalidatePath(`/chat/${room.id}`);

    return { ok: true };
  } catch {
    await connection.rollback();
    return { ok: false, formError: "訊息送出失敗，請稍後再試。" };
  } finally {
    connection.release();
  }
}
