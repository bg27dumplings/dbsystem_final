"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { describedBy } from "@/lib/a11y";

type FieldErrors = Partial<Record<"student_id" | "password" | "captcha", string>>;

type LoginResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: FieldErrors;
};

function nextCaptchaUrl() {
  return `/api/auth/captcha?ts=${Date.now()}`;
}

export function StudentLoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaUrl, setCaptchaUrl] = useState(nextCaptchaUrl());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCaptchaUrl(nextCaptchaUrl());
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          student_id: studentId,
          password,
          captcha,
          returnTo
        })
      });

      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "登入失敗，請稍後再試。");
        setFieldErrors(result.fieldErrors ?? {});
        setCaptcha("");
        setCaptchaUrl(nextCaptchaUrl());
        return;
      }

      router.push(result.redirectTo ?? "/");
      router.refresh();
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
      setCaptcha("");
      setCaptchaUrl(nextCaptchaUrl());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div className="rounded-2xl border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </div>
      ) : null}
      <input type="hidden" name="returnTo" value={returnTo ?? ""} />
      <div>
        <label htmlFor="student-id" className="font-bold text-campus-ink">
          學號
        </label>
        <input
          id="student-id"
          name="student_id"
          autoComplete="username"
          inputMode="text"
          required
          value={studentId}
          onChange={(event) => setStudentId(event.target.value.toUpperCase())}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-campus-moss focus:ring-2 focus:ring-campus-moss/20"
          aria-invalid={fieldErrors.student_id ? "true" : "false"}
          aria-describedby={fieldErrors.student_id ? describedBy("student-id", true) : undefined}
        />
        {fieldErrors.student_id ? (
          <p id="student-id-error" className="mt-2 text-sm font-semibold text-campus-red">
            {fieldErrors.student_id}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="password" className="font-bold text-campus-ink">
          密碼
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-campus-moss focus:ring-2 focus:ring-campus-moss/20"
          aria-invalid={fieldErrors.password ? "true" : "false"}
          aria-describedby={fieldErrors.password ? describedBy("password", true) : undefined}
        />
        {fieldErrors.password ? (
          <p id="password-error" className="mt-2 text-sm font-semibold text-campus-red">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      <div className="rounded-2xl bg-campus-paper p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <label htmlFor="captcha" className="font-bold text-campus-ink">
              驗證碼
            </label>
            <p className="mt-1 text-sm text-slate-700">每次送出都會重新驗證；若輸入錯誤，系統會刷新新的驗證碼。</p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-campus-moss px-3 py-2 text-sm font-black text-campus-moss hover:bg-white"
            onClick={() => {
              setCaptcha("");
              setCaptchaUrl(nextCaptchaUrl());
            }}
          >
            重新產生
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-campus-ink/10 bg-white">
          <img src={captchaUrl} alt="登入驗證碼圖片" className="h-20 w-full object-cover" />
        </div>
        <input
          id="captcha"
          name="captcha"
          required
          value={captcha}
          onChange={(event) => setCaptcha(event.target.value.toUpperCase())}
          className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-3 text-base uppercase tracking-[0.25em] outline-none transition focus:border-campus-moss focus:ring-2 focus:ring-campus-moss/20"
          aria-invalid={fieldErrors.captcha ? "true" : "false"}
          aria-describedby={`captcha-help ${fieldErrors.captcha ? "captcha-error" : ""}`.trim()}
        />
        <p id="captcha-help" className="mt-2 text-sm text-slate-700">
          請輸入圖片中的英數字。這個前台驗證碼與管理員後台 session 分開。
        </p>
        {fieldErrors.captcha ? (
          <p id="captcha-error" className="mt-2 text-sm font-semibold text-campus-red">
            {fieldErrors.captcha}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-campus-moss px-4 py-3 font-black text-white transition hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "登入中..." : "登入"}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
        <p>
          還沒有帳號？{" "}
          <Link href="/auth/register" className="font-black text-campus-blue underline">
            前往註冊
          </Link>
        </p>
        <Link href="/auth/forgot-password" className="font-black text-campus-moss underline">
          忘記密碼 / 帳號協助
        </Link>
      </div>
    </form>
  );
}
