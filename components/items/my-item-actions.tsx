"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ItemStatus } from "@/lib/marketplace/domain/models";

type ChangeStatusResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
};

const ACTION_LABELS = {
  deactivate: "下架",
  reactivate: "重新上架",
  delete: "刪除",
  request_review: "請求人工審核"
} as const;

function ManagementButton({
  onClick,
  disabled,
  children,
  destructive = false
}: {
  onClick: () => void;
  disabled?: boolean;
  children: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-2 font-bold ${
        destructive
          ? "border border-campus-red/20 text-campus-red"
          : "border border-campus-moss text-campus-moss"
      } disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400`}
    >
      {children}
    </button>
  );
}

export function MyItemActions({
  itemId,
  itemStatus
}: {
  itemId: string;
  itemStatus: ItemStatus;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<null | "deactivate" | "reactivate" | "delete" | "request_review">(null);
  const [formError, setFormError] = useState("");

  async function handleAction(action: "deactivate" | "reactivate" | "delete" | "request_review") {
    const confirmed = window.confirm(
      action === "delete"
        ? "刪除後前台不可復原，確定要刪除這筆物品嗎？"
        : action === "deactivate"
          ? "確定要下架這筆物品嗎？"
          : action === "request_review"
            ? "確定要請求人工審核嗎？管理員將重新檢視這筆物品。"
            : "確定要重新上架這筆物品嗎？"
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(action);
    setFormError("");

    try {
      if (action === "request_review") {
        const response = await fetch(`/api/items/${encodeURIComponent(itemId)}/request-review`, {
          method: "POST"
        });
        const result = (await response.json()) as ChangeStatusResponse;
        if (!response.ok || !result.ok) {
          setFormError(result.formError ?? "申請失敗，請稍後再試。");
          return;
        }
        window.location.reload();
        return;
      }

      const isStatusChange = action === "deactivate" || action === "reactivate";
      const method = isStatusChange ? "PATCH" : "DELETE";
      const url = isStatusChange 
        ? `/api/items/${encodeURIComponent(itemId)}/status`
        : `/api/items/${encodeURIComponent(itemId)}`;
      
      const body = isStatusChange 
        ? JSON.stringify({ status: action === "deactivate" ? "removed" : "active" })
        : undefined;

      const response = await fetch(url, {
        method,
        headers: isStatusChange ? { "Content-Type": "application/json" } : undefined,
        body
      });
      const result = (await response.json()) as ChangeStatusResponse;

      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "狀態更新失敗，請稍後再試。");
        return;
      }

      window.location.assign(result.redirectTo ?? "/me/items");
      router.refresh();
    } catch {
      setFormError("狀態更新失敗，請稍後再試。");
    } finally {
      setIsSubmitting(null);
    }
  }

  if (itemStatus === "reserved") {
    return (
      <div className="grid gap-2">
        <Link href={`/items/${itemId}`} className="rounded-md border border-campus-moss px-3 py-2 font-bold text-campus-moss">
          查看
        </Link>
        <p className="text-sm font-semibold text-slate-600">預約中不可編輯</p>
      </div>
    );
  }

  if (itemStatus === "violation_removed") {
    return <p className="text-sm font-semibold text-campus-red">違規下架的物品不可由前台操作</p>;
  }

  if (itemStatus === "deleted") {
    return <p className="text-sm font-semibold text-slate-600">已刪除的物品不可由前台復原</p>;
  }

  if (itemStatus === "completed") {
    return <p className="text-sm font-semibold text-slate-600">已完成交易的物品不可修改</p>;
  }

  if (itemStatus === "pending_review") {
    return <p className="text-sm font-semibold text-slate-600">人工審核中，請耐心等候。</p>;
  }

  return (
    <div className="grid gap-2">
      {itemStatus === "ai_blocked" ? (
        <div className="rounded-lg border border-campus-red/20 bg-rose-50 px-4 py-3 mb-2">
          <p className="text-sm font-semibold text-campus-red mb-2">此物品被 AI 系統判斷疑似包含違規內容，已自動阻擋。</p>
          <ManagementButton
            onClick={() => void handleAction("request_review")}
            disabled={isSubmitting !== null}
          >
            {isSubmitting === "request_review" ? "申請中..." : ACTION_LABELS.request_review}
          </ManagementButton>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Link href={`/me/items/${itemId}/edit`} className="rounded-md border border-campus-moss px-3 py-2 font-bold text-campus-moss">
          編輯
        </Link>
        {itemStatus === "active" ? (
          <ManagementButton
            onClick={() => void handleAction("deactivate")}
            disabled={isSubmitting !== null}
          >
            {isSubmitting === "deactivate" ? "下架中..." : ACTION_LABELS.deactivate}
          </ManagementButton>
        ) : null}
        {itemStatus === "removed" ? (
          <ManagementButton
            onClick={() => void handleAction("reactivate")}
            disabled={isSubmitting !== null}
          >
            {isSubmitting === "reactivate" ? "重新上架中..." : ACTION_LABELS.reactivate}
          </ManagementButton>
        ) : null}
        <ManagementButton
          onClick={() => void handleAction("delete")}
          disabled={isSubmitting !== null}
          destructive
        >
          {isSubmitting === "delete" ? "刪除中..." : ACTION_LABELS.delete}
        </ManagementButton>
      </div>
      {formError ? (
        <p className="rounded-lg border border-campus-red/20 bg-rose-50 px-3 py-2 text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </p>
      ) : null}
    </div>
  );
}
