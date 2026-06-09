"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppointmentStatus } from "@/lib/marketplace/types";

export function AppointmentActions({
  appointmentId,
  status,
  viewerRole
}: {
  appointmentId: string;
  status: AppointmentStatus;
  viewerRole: "buyer" | "seller";
}) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAction(action: "accept" | "reject" | "cancel") {
    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      const result = (await response.json()) as { ok: boolean; formError?: string; redirectTo?: string };
      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "操作失敗，請稍後再試。");
        return;
      }

      router.push(result.redirectTo ?? `/me/appointments/${appointmentId}`);
      router.refresh();
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSellerRespond = viewerRole === "seller" && status === "pending";
  const canCancel = ["pending", "accepted"].includes(status);

  if (!canSellerRespond && !canCancel) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-campus-ink/10 bg-campus-paper p-4">
      <h2 className="font-black text-campus-ink">預約操作</h2>
      {formError ? (
        <p className="text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canSellerRespond ? (
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction("accept")}
              className="rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              同意面交
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction("reject")}
              className="rounded-md border border-campus-red/30 px-4 py-3 font-black text-campus-red hover:bg-rose-50 disabled:cursor-not-allowed"
            >
              拒絕預約
            </button>
          </>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction("cancel")}
            className="rounded-md border border-slate-300 px-4 py-3 font-black text-slate-700 hover:bg-white disabled:cursor-not-allowed"
          >
            取消預約
          </button>
        ) : null}
      </div>
    </div>
  );
}
