import { StudentRegisterForm } from "@/components/auth/student-register-form";

export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="register-heading">
      <p className="text-sm font-black text-campus-moss">建立會員</p>
      <h1 id="register-heading" className="mt-1 text-3xl font-black text-campus-ink">
        學生註冊
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        完成註冊後會直接建立登入 session，之後就能上架物品、聊天與預約面交。
      </p>
      <StudentRegisterForm />
    </section>
  );
}
