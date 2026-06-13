"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StatusToggleActions({ itemId, currentStatus }: { itemId: string; currentStatus: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentStatus !== "active" && currentStatus !== "removed") {
    return null;
  }

  async function handleToggle() {
    const newStatus = currentStatus === "active" ? "removed" : "active";
    const actionName = newStatus === "active" ? "重新上架" : "下架";
    
    if (!confirm(`確定要將此物品${actionName}嗎？`)) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/items/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("操作失敗");
      router.refresh();
    } catch (e) {
      alert("操作失敗，請稍後再試。");
      setIsSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isSubmitting}
      className={`rounded-md px-3 py-2 text-sm font-bold ${
        currentStatus === "active" 
          ? "bg-slate-200 text-slate-700 hover:bg-slate-300" 
          : "bg-campus-gold text-white hover:bg-yellow-600"
      } disabled:opacity-50`}
    >
      {currentStatus === "active" ? "暫時下架" : "重新上架"}
    </button>
  );
}
