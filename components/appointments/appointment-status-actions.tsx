"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AppointmentAction = "accept" | "reject" | "cancel" | "complete" | "fail";
type AppointmentActionResponse = {
  ok: boolean;
  formError?: string;
};

function ActionButton({
  label,
  action,
  currentAction,
  onClick,
  destructive = false
}: {
  label: string;
  action: AppointmentAction;
  currentAction: AppointmentAction | null;
  onClick: (action: AppointmentAction) => void;
  destructive?: boolean;
}) {
  const isSubmitting = currentAction === action;

  return (
    <button
      type="button"
      onClick={() => onClick(action)}
      disabled={currentAction !== null}
      className={`inline-flex min-h-12 items-center justify-center rounded-md px-4 py-3 font-black ${
        destructive
          ? "border border-campus-red/20 text-campus-red"
          : "border border-campus-moss text-campus-moss"
      } disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400`}
    >
      {isSubmitting ? "處理中..." : label}
    </button>
  );
}

export function AppointmentStatusActions({
  appointmentId,
  canAccept,
  canReject,
  canCancel,
  canComplete,
  canFail
}: {
  appointmentId: string;
  canAccept: boolean;
  canReject: boolean;
  canCancel: boolean;
  canComplete: boolean;
  canFail: boolean;
}) {
  const router = useRouter();
  const [currentAction, setCurrentAction] = useState<AppointmentAction | null>(null);
  const [formError, setFormError] = useState("");

  async function handleAction(action: AppointmentAction) {
    const confirmMessage = {
      accept: "確定要接受這筆面交預約嗎？",
      reject: "確定要拒絕這筆面交預約嗎？",
      cancel: "確定要取消這筆面交預約嗎？",
      complete: "確定要將這筆面交標記為已完成嗎？",
      fail: "確定要將這筆面交標記為交易失敗嗎？"
    }[action];

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setCurrentAction(action);
    setFormError("");

    try {
      const response = await fetch(`/api/appointments/${encodeURIComponent(appointmentId)}/${action}`, {
        method: "POST"
      });
      const result = (await response.json()) as AppointmentActionResponse;

      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "狀態更新失敗，請稍後再試。");
        return;
      }

      router.refresh();
    } catch {
      setFormError("狀態更新失敗，請稍後再試。");
    } finally {
      setCurrentAction(null);
    }
  }

  if (!canAccept && !canReject && !canCancel && !canComplete && !canFail) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-lg border border-campus-ink/10 bg-slate-50 p-4" aria-labelledby="appointment-actions-heading">
      <h2 id="appointment-actions-heading" className="text-lg font-black text-campus-ink">
        預約操作
      </h2>
      <div className="flex flex-wrap gap-3">
        {canAccept ? <ActionButton label="接受預約" action="accept" currentAction={currentAction} onClick={handleAction} /> : null}
        {canReject ? <ActionButton label="拒絕預約" action="reject" currentAction={currentAction} onClick={handleAction} destructive /> : null}
        {canCancel ? <ActionButton label="取消預約" action="cancel" currentAction={currentAction} onClick={handleAction} destructive /> : null}
        {canComplete ? <ActionButton label="標記完成" action="complete" currentAction={currentAction} onClick={handleAction} /> : null}
        {canFail ? <ActionButton label="標記失敗" action="fail" currentAction={currentAction} onClick={handleAction} destructive /> : null}
      </div>
      {formError ? (
        <p className="rounded-lg border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </p>
      ) : null}
    </section>
  );
}
