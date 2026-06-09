"use client";

import Link from "next/link";
import { useState } from "react";
import type { ItemStatus } from "@/lib/marketplace/domain/models";

type OpenChatRoomResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
};

export function ItemActions({
  itemId,
  itemStatus
}: {
  itemId: string;
  itemStatus: ItemStatus;
}) {
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [chatError, setChatError] = useState("");

  async function handleOpenChat() {
    setIsOpeningChat(true);
    setChatError("");

    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ itemId })
      });

      const result = (await response.json()) as OpenChatRoomResponse;
      if (!response.ok || !result.ok) {
        if (result.redirectTo) {
          window.location.assign(result.redirectTo);
          return;
        }

        setChatError(result.formError ?? "聊天室建立失敗，請稍後再試。");
        return;
      }

      window.location.assign(result.redirectTo ?? "/chat");
    } catch {
      setChatError("聊天室建立失敗，請稍後再試。");
    } finally {
      setIsOpeningChat(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleOpenChat}
          disabled={isOpeningChat}
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-campus-moss px-4 py-3 font-black text-campus-moss hover:bg-campus-paper disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-500"
        >
          {isOpeningChat ? "建立聊天室中..." : "私聊詢問"}
        </button>
        {itemStatus === "active" ? (
          <Link
            href={`/appointments/new?itemId=${encodeURIComponent(itemId)}`}
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink"
          >
            提出面交
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-slate-400 px-4 py-3 font-black text-white"
          >
            {itemStatus === "hidden" || itemStatus === "reserved" ? "名額已滿" : "目前無法預約"}
          </span>
        )}
      </div>
      {chatError ? (
        <p className="rounded-lg border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {chatError}
        </p>
      ) : null}
    </div>
  );
}
