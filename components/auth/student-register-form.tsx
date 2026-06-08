"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { describedBy } from "@/lib/a11y";

type FieldKey = "name" | "student_id" | "email" | "email_code" | "password" | "confirm_password";
type FieldErrors = Partial<Record<FieldKey, string>>;

type RegisterResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: FieldErrors;
};

export function StudentRegisterForm() {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [verificationSent, setVerificationSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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
        body: JSON.stringify({ email })
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          student_id: studentId,
          email,
          email_code: emailCode,
          password,
          confirm_password: confirmPassword
        })
      });

      const result = (await response.json()) as RegisterResponse;
      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "註冊失敗，請稍後再試。");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      window.location.assign(result.redirectTo ?? "/");
      return;
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div className="rounded-2xl border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </div>
      ) : null}
      <div>
        <label htmlFor="name" className="font-bold">
          姓名
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
          aria-invalid={fieldErrors.name ? "true" : "false"}
          aria-describedby={fieldErrors.name ? describedBy("name", true) : undefined}
        />
        {fieldErrors.name ? <p id="name-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.name}</p> : null}
      </div>
      <div>
        <label htmlFor="student-id" className="font-bold">
          學號
        </label>
        <input
          id="student-id"
          name="student_id"
          required
          value={studentId}
          onChange={(event) => setStudentId(event.target.value.toUpperCase())}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
          placeholder="ABC113001"
          aria-invalid={fieldErrors.student_id ? "true" : "false"}
          aria-describedby={`register-student-id-help ${fieldErrors.student_id ? "student-id-error" : ""}`.trim()}
        />
        <p id="register-student-id-help" className="mt-2 text-sm text-slate-700">格式為 3 個英文字加 6 個數字，例如 `ABC113001`；中間 3 碼代表民國入學年。</p>
        {fieldErrors.student_id ? <p id="student-id-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.student_id}</p> : null}
      </div>
      <div>
        <label htmlFor="email" className="font-bold">
          校園信箱 (Gmail)
        </label>
        <div className="flex gap-2 mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-3"
            aria-describedby={`register-email-help ${fieldErrors.email ? "email-error" : ""}`.trim()}
            aria-invalid={fieldErrors.email ? "true" : "false"}
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isSendingCode || !email || (verificationSent && countdown > 0)}
            className="shrink-0 rounded-md bg-campus-moss px-4 text-sm font-bold text-white hover:bg-campus-ink disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `${countdown} 秒後可重寄` : isSendingCode ? "傳送中..." : "傳送驗證碼"}
          </button>
        </div>
        <p id="register-email-help" className="mt-2 text-sm text-slate-700">後續忘記密碼與帳號通知會使用此電子信箱。</p>
        {fieldErrors.email ? <p id="email-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.email}</p> : null}
      </div>

      {verificationSent && (
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
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-center text-lg font-mono tracking-widest"
            aria-invalid={fieldErrors.email_code ? "true" : "false"}
          />
          {fieldErrors.email_code ? <p className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.email_code}</p> : null}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="font-bold">
            密碼
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.password ? "true" : "false"}
            aria-describedby={fieldErrors.password ? describedBy("password", true) : undefined}
          />
          {fieldErrors.password ? <p id="password-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.password}</p> : null}
        </div>
        <div>
          <label htmlFor="confirm-password" className="font-bold">
            確認密碼
          </label>
          <input
            id="confirm-password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
            aria-invalid={fieldErrors.confirm_password ? "true" : "false"}
            aria-describedby={fieldErrors.confirm_password ? describedBy("confirm-password", true) : undefined}
          />
          {fieldErrors.confirm_password ? <p id="confirm-password-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.confirm_password}</p> : null}
        </div>
      </div>
      <button type="submit" disabled={isSubmitting} className="rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400">
        {isSubmitting ? "註冊中..." : "註冊"}
      </button>
      <p className="text-sm text-slate-700">
        已經有帳號？{" "}
        <Link href="/auth/login" className="font-black text-campus-blue underline">
          直接登入
        </Link>
      </p>
    </form>
  );
}
