"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { describedBy } from "@/lib/a11y";

type FieldKey = "name" | "student_id" | "email" | "password" | "confirm_password";
type FieldErrors = Partial<Record<FieldKey, string>>;

type RegisterResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: FieldErrors;
};

export function StudentRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      router.push(result.redirectTo ?? "/");
      router.refresh();
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
          校園信箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
          aria-describedby={`register-email-help ${fieldErrors.email ? "email-error" : ""}`.trim()}
          aria-invalid={fieldErrors.email ? "true" : "false"}
        />
        <p id="register-email-help" className="mt-2 text-sm text-slate-700">後續忘記密碼與帳號通知會使用校園信箱。</p>
        {fieldErrors.email ? <p id="email-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.email}</p> : null}
      </div>
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
