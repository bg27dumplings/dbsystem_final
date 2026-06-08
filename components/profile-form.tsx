"use client";

import { FormEvent, useState } from "react";
import { Settings, X } from "lucide-react";

type ProfileFormProps = {
  studentNo: string;
  initialName: string;
  initialEmail: string;
  onSuccess?: () => void;
};

export function ProfileForm({ studentNo, initialName, initialEmail, onSuccess }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setSuccessMsg("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "個人資料修改失敗。");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setSuccessMsg("個人資料已成功更新！");
      setPassword("");
      setConfirmPassword("");
      
      if (onSuccess) {
        onSuccess();
      }

      // Reload the page to refresh session names/data in the layout
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      setFormError("系統忙碌中，更新失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4 rounded-lg bg-campus-paper p-5 shadow-sm ring-1 ring-campus-ink/5" onSubmit={handleSubmit} noValidate>
      <h2 className="text-xl font-black text-campus-ink">個人資料設定</h2>
      
      {formError ? (
        <div className="rounded-xl border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </div>
      ) : null}
      
      {successMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
          {successMsg}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-bold text-slate-700">學號 (不可修改)</label>
          <input
            type="text"
            disabled
            value={studentNo}
            className="mt-1 w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-3 text-slate-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="profile-name" className="block text-sm font-bold text-slate-700">姓名</label>
          <input
            id="profile-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.name ? "true" : "false"}
          />
          {fieldErrors.name ? <p className="mt-1 text-xs font-semibold text-campus-red">{fieldErrors.name}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="profile-email" className="block text-sm font-bold text-slate-700">電子信箱</label>
          <input
            id="profile-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.email ? "true" : "false"}
          />
          {fieldErrors.email ? <p className="mt-1 text-xs font-semibold text-campus-red">{fieldErrors.email}</p> : null}
        </div>
        <div>
          <label htmlFor="profile-password" className="block text-sm font-bold text-slate-700">新密碼 (不修改請留空)</label>
          <input
            id="profile-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 8 個字元"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.password ? "true" : "false"}
          />
          {fieldErrors.password ? <p className="mt-1 text-xs font-semibold text-campus-red">{fieldErrors.password}</p> : null}
        </div>
        <div>
          <label htmlFor="profile-confirm-password" className="block text-sm font-bold text-slate-700">確認新密碼</label>
          <input
            id="profile-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.confirmPassword ? "true" : "false"}
          />
          {fieldErrors.confirmPassword ? <p className="mt-1 text-xs font-semibold text-campus-red">{fieldErrors.confirmPassword}</p> : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "正在儲存..." : "儲存設定"}
      </button>
    </form>
  );
}

type ProfileSettingsModalProps = {
  studentNo: string;
  initialName: string;
  initialEmail: string;
};

export function ProfileSettingsModal({ studentNo, initialName, initialEmail }: ProfileSettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-campus-moss px-4 py-3 font-black text-campus-moss hover:bg-campus-paper transition"
        title="個人資料設定"
        aria-label="個人資料設定"
      >
        <Settings size={18} strokeWidth={2.5} />
        <span>設定</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-campus-ink/65 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="關閉視窗"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
            <ProfileForm
              studentNo={studentNo}
              initialName={initialName}
              initialEmail={initialEmail}
              onSuccess={() => {
                setTimeout(() => setIsOpen(false), 1200);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
