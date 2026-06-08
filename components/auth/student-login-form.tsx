"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
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

let initialCaptchaPromise: Promise<string> | null = null;

function getInitialCaptcha() {
  if (typeof window === "undefined") {
    return Promise.resolve("");
  }
  if (!initialCaptchaPromise) {
    initialCaptchaPromise = fetch(`/api/auth/captcha?ts=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch captcha");
        return res.text();
      })
      .catch((err) => {
        initialCaptchaPromise = null;
        throw err;
      });
  }
  return initialCaptchaPromise;
}

function normalizeReturnTo(returnTo?: string | null) {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/";
  }

  return returnTo;
}

function resolvePostLoginTarget(resultRedirectTo: string | undefined, effectiveReturnTo: string) {
  const normalizedResult = normalizeReturnTo(resultRedirectTo);
  if (effectiveReturnTo !== "/" && normalizedResult === "/") {
    return effectiveReturnTo;
  }

  return normalizedResult;
}

export function StudentLoginForm({ returnTo }: { returnTo?: string }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [effectiveReturnTo, setEffectiveReturnTo] = useState(() => normalizeReturnTo(returnTo));

  useEffect(() => {
    let active = true;
    getInitialCaptcha()
      .then((svg) => {
        if (active) setCaptchaSvg(svg);
      })
      .catch(() => {
        if (active) setCaptchaSvg("");
      });

    if (!returnTo && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setEffectiveReturnTo(normalizeReturnTo(params.get("returnTo")));
    }

    return () => {
      active = false;
      // Clear the cache after a short delay so that Strict Mode can reuse it,
      // but client-side transitions to other pages will get a fresh captcha on return.
      setTimeout(() => {
        initialCaptchaPromise = null;
      }, 500);
    };
  }, []);

  async function refreshCaptcha() {
    setCaptcha("");
    setCaptchaSvg("");
    const promise = fetch(`/api/auth/captcha?ts=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch captcha");
        return res.text();
      });
    initialCaptchaPromise = promise;
    try {
      const svg = await promise;
      setCaptchaSvg(svg);
    } catch {
      setCaptchaSvg("");
      initialCaptchaPromise = null;
    }
  }

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
          returnTo: effectiveReturnTo
        })
      });

      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "登入失敗，請稍後再試。");
        setFieldErrors(result.fieldErrors ?? {});
        setCaptcha("");
        await refreshCaptcha();
        return;
      }

      window.location.assign(resolvePostLoginTarget(result.redirectTo, effectiveReturnTo));
      return;
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
      setCaptcha("");
      await refreshCaptcha();
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
      <input type="hidden" name="returnTo" value={effectiveReturnTo} />
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
          placeholder="ABC113001"
          aria-invalid={fieldErrors.student_id ? "true" : "false"}
          aria-describedby={`login-student-id-help ${fieldErrors.student_id ? "student-id-error" : ""}`.trim()}
        />
        <p id="login-student-id-help" className="mt-2 text-sm text-slate-700">請輸入 3 個英文字加 6 個數字的學號，中間 3 碼為民國入學年。</p>
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
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-campus-moss px-3 py-2 text-campus-moss hover:bg-white"
            onClick={refreshCaptcha}
            aria-label="重新產生驗證碼"
            title="重新產生驗證碼"
          >
            <RefreshCw aria-hidden="true" size={16} strokeWidth={2.5} />
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-campus-ink/10 bg-white min-h-20 flex items-center justify-center">
          {captchaSvg ? (
            <div dangerouslySetInnerHTML={{ __html: captchaSvg }} className="h-20 w-full flex items-center justify-center" />
          ) : (
            <div className="h-20 flex items-center justify-center text-sm text-slate-400 font-bold">驗證碼載入中...</div>
          )}
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
