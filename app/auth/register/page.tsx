export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="register-heading">
      <p className="text-sm font-black text-campus-moss">建立會員</p>
      <h1 id="register-heading" className="mt-1 text-3xl font-black text-campus-ink">
        學生註冊
      </h1>
      <form className="mt-6 grid gap-4">
        <div>
          <label htmlFor="name" className="font-bold">姓名</label>
          <input id="name" name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
        </div>
        <div>
          <label htmlFor="student-id" className="font-bold">學號</label>
          <input id="student-id" name="student_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
        </div>
        <div>
          <label htmlFor="email" className="font-bold">校園信箱</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" aria-describedby="register-email-help" />
          <p id="register-email-help" className="mt-2 text-sm text-slate-700">後續忘記密碼與帳號通知會使用校園信箱。</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="font-bold">密碼</label>
            <input id="password" type="password" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
          </div>
          <div>
            <label htmlFor="confirm-password" className="font-bold">確認密碼</label>
            <input id="confirm-password" type="password" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
          </div>
        </div>
        <button type="submit" className="rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">註冊</button>
      </form>
    </section>
  );
}
