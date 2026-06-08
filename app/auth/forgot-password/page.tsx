import { StudentForgotPasswordForm } from "@/components/auth/student-forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="forgot-password-heading">
      <p className="text-sm font-black text-campus-moss">帳號協助</p>
      <h1 id="forgot-password-heading" className="mt-1 text-3xl font-black text-campus-ink">
        忘記密碼 / 重設密碼
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        輸入註冊時使用的校園信箱 (Gmail) 以獲取重設驗證碼，驗證成功後即可設定新密碼。
      </p>
      <StudentForgotPasswordForm />
    </section>
  );
}
