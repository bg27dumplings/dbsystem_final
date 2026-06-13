"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AiBlockedActions({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestReview() {
    if (!confirm("確定要申請人工審查嗎？這可能會需要幾個工作天。")) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/items/${itemId}/request-review`, { method: "POST" });
      if (!res.ok) throw new Error("申請失敗");
      router.refresh();
    } catch (e) {
      setError("申請失敗，請稍後再試。");
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("確定要刪除這個被阻擋的物品嗎？刪除後無法恢復。")) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/items/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "deleted" })
      });
      if (!res.ok) throw new Error("刪除失敗");
      router.refresh();
    } catch (e) {
      setError("刪除失敗，請稍後再試。");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-3">
      {error && <p className="mb-2 text-sm font-bold text-campus-red">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRequestReview}
          disabled={isSubmitting}
          className="rounded-md bg-campus-gold px-3 py-2 text-sm font-bold text-white hover:bg-yellow-600 disabled:opacity-50"
        >
          申請人工審查
        </button>
        <button
          onClick={handleDelete}
          disabled={isSubmitting}
          className="rounded-md border border-campus-red px-3 py-2 text-sm font-bold text-campus-red hover:bg-red-50 disabled:opacity-50"
        >
          刪除物品
        </button>
      </div>
    </div>
  );
}
