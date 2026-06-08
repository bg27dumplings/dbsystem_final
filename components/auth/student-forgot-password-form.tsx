"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { describedBy } from "@/lib/a11y";

type FieldKey = "email" | "email_code" | "new_password" | "confirm_password";
type FieldErrors = Partial<Record<FieldKey, string>>;

export function StudentForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [verificationSent, setVerificationSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(3);

  // Verification code resend countdown timer
  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle countdown redirection on success
  useEffect(() => {
    if (!success) return;
    if (redirectTimer === 0) {
      window.location.assign("/auth/login");
      return;
    }
    const timer = setTimeout(() => {
      setRedirectTimer((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [success, redirectTimer]);

  async function handleSendCode() {
    if (!email) {
      setFieldErrors({ email: "請先輸入電子信箱。" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldErrors({ email: "信箱格式不正確。" });
      return;
    }

    setIsSendingCode(true);
    setFormError("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "發送驗證信失敗，請重試。");
        return;
      }

      setVerificationSent(true);
      setCountdown(60);
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          email_code: emailCode,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "密碼重設失敗，請檢查欄位。");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setSuccess(true);
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-500/10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-black text-emerald-900">密碼重設成功！</h3>
        <p className="mt-2 text-sm text-emerald-700">
          您的新密碼已設定完成。系統將在 <span className="font-bold">{redirectTimer}</span> 秒後自動跳轉至登入頁面...
        </p>
        <div className="mt-6">
          <Link
            href="/auth/login"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-campus-moss px-4 py-2 font-black text-white hover:bg-campus-ink"
          >
            立即前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div className="rounded-2xl border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="font-bold text-campus-ink">
          校園信箱 (Gmail)
        </label>
        <div className="flex gap-2 mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={verificationSent}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-3 outline-none transition focus:border-campus-moss focus:ring-2 focus:ring-campus-moss/20 disabled:bg-slate-50 disabled:text-slate-500"
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            aria-invalid={fieldErrors.email ? "true" : "false"}
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isSendingCode || !email || (verificationSent && countdown > 0)}
            className="shrink-0 rounded-md bg-campus-moss px-4 text-sm font-bold text-white hover:bg-campus-ink disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            {countdown > 0 ? `${countdown} 秒後可重寄` : isSendingCode ? "傳送中..." : verificationSent ? "重新傳送驗證碼" : "傳送驗證碼"}
          </button>
        </div>
        {fieldErrors.email ? (
          <p id="email-error" className="mt-2 text-sm font-semibold text-campus-red">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      {verificationSent && (
        <>
          <div className="rounded-2xl bg-campus-paper p-4 ring-1 ring-campus-ink/5">
            <label htmlFor="email-code" className="font-bold block text-campus-ink">
              信箱驗證碼
            </label>
            <p className="mt-1 text-sm text-slate-700">我們已向該信箱發送了 6 位數驗證碼，請在下方輸入。</p>
            <input
              id="email-code"
              name="email_code"
              type="text"
              required
              value={emailCode}
              onChange={(event) => setEmailCode(event.target.value.trim())}
              placeholder="123456"
              maxLength={6}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-center text-lg font-mono tracking-widest outline-none transition focus:border-campus-moss focus:ring-2 focus:ring-campus-moss/20"
              aria-invalid={fieldErrors.email_code ? "true" : "false"}
              aria-describedby={fieldErrors.email_code ? "email-code-error" : undefined}
            />
            {fieldErrors.email_code ? (
              <p id="email-code-error" className="mt-2 text-sm font-semibold text-campus-red">
                {fieldErrors.email_code}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="font-bold text-campus-ink">
                設定新密碼
              </label>
              <input
                id="password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 outline-none transition focus:border-campus-moss focus:ring-2 focus:ring-campus-moss/20"
                aria-invalid={fieldErrors.new_password ? "true" : "false"}
                aria-describedby={fieldErrors.new_password ? "password-error" : undefined}
              />
              {fieldErrors.new_password ? (
                <p id="password-error" className="mt-2 text-sm font-semibold text-campus-red">
                  {fieldErrors.new_password}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="confirm-password" className="font-bold text-campus-ink">
                再次確認新密碼
              </label>
              <input
                id="confirm-password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 outline-none transition focus:border-campus-moss focus:ring-2 focus:ring-campus-moss/20"
                aria-invalid={fieldErrors.confirm_password ? "true" : "false"}
                aria-describedby={fieldErrors.confirm_password ? "confirm-password-error" : undefined}
              />
              {fieldErrors.confirm_password ? (
                <p id="confirm-password-error" className="mt-2 text-sm font-semibold text-campus-red">
                  {fieldErrors.confirm_password}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400 transition"
          >
            {isSubmitting ? "重設密碼中..." : "重設密碼"}
          </button>
        </>
      )}

      <div className="flex justify-between items-center text-sm mt-2">
        <Link href="/auth/login" className="font-black text-campus-blue underline">
          返回登入
        </Link>
        <Link href="/auth/register" className="font-black text-campus-moss underline">
          前往註冊
        </Link>
      </div>
    </form>
  );
}
