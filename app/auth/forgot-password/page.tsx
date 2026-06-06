import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-campus-ink/10 md:p-8" aria-labelledby="forgot-password-heading">
      <p className="text-sm font-black text-campus-moss">帳號協助</p>
      <h1 id="forgot-password-heading" className="mt-1 text-3xl font-black text-campus-ink">
        忘記密碼 / 帳號問題協助
      </h1>
      <p className="mt-4 leading-7 text-slate-700">
        這個入口已保留給後續完整的校園信箱重設流程。目前若你忘記密碼，請先透過課程或校務指定管道聯繫管理方協助處理。
      </p>
      <div className="mt-6 rounded-2xl bg-campus-paper p-4 text-sm leading-6 text-slate-700">
        <p className="font-black text-campus-ink">後續規劃</p>
        <p className="mt-2">完成註冊並綁定校園信箱後，這裡會補上自助式重設密碼流程與通知信寄送。</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/auth/login" className="inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          返回登入
        </Link>
        <Link href="/auth/register" className="inline-flex min-h-12 items-center justify-center rounded-md border border-campus-moss px-4 py-3 font-black text-campus-moss hover:bg-campus-paper">
          前往註冊
        </Link>
      </div>
    </section>
  );
}
