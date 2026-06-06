import { redirect } from "next/navigation";
import { StudentLoginForm } from "@/components/auth/student-login-form";
import { getStudentSession } from "@/lib/auth/student-session";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const [session, { returnTo }] = await Promise.all([getStudentSession(), searchParams]);

  if (session) {
    redirect("/");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <section className="rounded-[2rem] border border-campus-ink/10 bg-[linear-gradient(145deg,rgba(249,248,241,0.95),rgba(232,241,234,0.85))] p-6 shadow-sm md:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-campus-moss">Student Access</p>
        <h1 className="mt-3 max-w-xl text-4xl font-black leading-tight text-campus-ink md:text-5xl">
          會員登入後即可聊天、預約、上架與管理自己的物品
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          使用學號、密碼與驗證碼快速登入。未登入狀態仍可瀏覽首頁、搜尋與物品詳情，但聊天、預約與個人物品管理需要先完成登入。
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["聊天聯絡", "快速詢問賣家、確認面交細節。"],
            ["面交預約", "登入後才能建立與管理預約。"],
            ["上架管理", "維護個人物品、編輯與下架。"]
          ].map(([title, description]) => (
            <article key={title} className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-campus-ink/10">
              <h2 className="text-base font-black text-campus-ink">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-campus-ink/10 md:p-8" aria-labelledby="login-heading">
        <p className="text-sm font-black text-campus-moss">會員登入</p>
        <h2 id="login-heading" className="mt-1 text-3xl font-black text-campus-ink">
          進入你的校園共享帳號
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          若帳號處於凍結狀態，將無法登入與上架。忘記密碼入口先作為協助保留，後續會串接完整重設流程。
        </p>
        <StudentLoginForm returnTo={returnTo} />
      </section>
    </div>
  );
}
