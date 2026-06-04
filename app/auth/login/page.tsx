import Link from "next/link";
import { describedBy } from "@/lib/a11y";

export default function LoginPage() {
  const hasError = false;

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="login-heading">
      <p className="text-sm font-black text-campus-moss">會員認證</p>
      <h1 id="login-heading" className="mt-1 text-3xl font-black text-campus-ink">
        使用學號登入
      </h1>
      <form className="mt-6 space-y-4">
        <div>
          <label htmlFor="student-id" className="font-bold">
            學號
          </label>
          <input id="student-id" name="student_id" autoComplete="username" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" aria-describedby={describedBy("student-id", hasError)} />
        </div>
        <div>
          <label htmlFor="password" className="font-bold">
            密碼
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
        </div>
        <div className="rounded-lg bg-campus-paper p-4">
          <label htmlFor="captcha" className="font-bold">
            圖形驗證碼
          </label>
          <div className="mt-2 flex items-center gap-3">
            <div role="img" aria-label="驗證碼圖片，文字為 CAMPUS" className="rounded-md bg-white px-4 py-3 font-mono text-xl font-black tracking-[0.35em] text-campus-ink ring-1 ring-campus-ink/10">
              CAMPUS
            </div>
            <button type="button" className="rounded-md border border-campus-moss px-3 py-2 text-sm font-bold text-campus-moss">
              重新產生
            </button>
          </div>
          <input id="captcha" name="captcha" required className="mt-3 w-full rounded-md border border-slate-300 px-3 py-3" aria-describedby="captcha-help" />
          <p id="captcha-help" className="mt-2 text-sm text-slate-700">
            實作時此圖片由 Gregwar/Captcha 產生，錯誤會顯示在欄位下方。
          </p>
        </div>
        <button type="submit" className="w-full rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          登入
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-700">
        還沒有帳號？{" "}
        <Link href="/auth/register" className="font-black text-campus-blue underline">
          註冊
        </Link>
      </p>
    </section>
  );
}
