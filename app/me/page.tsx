import Link from "next/link";
import { MeSubnav } from "@/components/me/me-subnav";
import { requireStudentSession } from "@/lib/auth/guards";
import {
  findAppointmentsByStudentId,
  findItemsByStudentId,
  findPendingAppointmentCount,
  findStudentProfileById
} from "@/lib/marketplace/queries";

export default async function MeOverviewPage() {
  const session = await requireStudentSession("/me");
  const [items, appointments, pendingCount, profile] = await Promise.all([
    findItemsByStudentId(session.studentId),
    findAppointmentsByStudentId(session.studentId),
    findPendingAppointmentCount(session.studentId),
    findStudentProfileById(session.studentId)
  ]);

  const activeAppointments = appointments.filter((appointment) =>
    ["pending", "accepted"].includes(appointment.status)
  );

  return (
    <section aria-labelledby="me-heading" className="space-y-5">
      <div>
        <p className="text-sm font-black text-campus-moss">我的</p>
        <h1 id="me-heading" className="text-3xl font-black text-campus-ink">我的總覽</h1>
        <p className="mt-2 text-slate-700">管理你的物品、面交預約與個人評價。</p>
      </div>
      <MeSubnav active="overview" />
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10">
          <p className="text-sm font-black text-campus-moss">我的物品</p>
          <p className="mt-2 text-3xl font-black text-campus-ink">{items.length}</p>
          <p className="mt-1 text-sm text-slate-700">目前上架中的物品數量</p>
          <Link href="/me/items" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-campus-moss px-4 py-2 font-black text-campus-moss">
            查看物品
          </Link>
        </article>
        <article className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10">
          <p className="text-sm font-black text-campus-moss">我的預約</p>
          <p className="mt-2 text-3xl font-black text-campus-ink">{activeAppointments.length}</p>
          <p className="mt-1 text-sm text-slate-700">
            進行中預約 {activeAppointments.length} 筆，待回覆 {pendingCount} 筆
          </p>
          <Link href="/me/appointments" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-campus-moss px-4 py-2 font-black text-campus-moss">
            查看預約
          </Link>
        </article>
        <article className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10">
          <p className="text-sm font-black text-campus-moss">個人評價</p>
          <p className="mt-2 text-3xl font-black text-campus-ink">{profile?.rating.averageRating.toFixed(1) ?? "0.0"}</p>
          <p className="mt-1 text-sm text-slate-700">累積 {profile?.rating.reviewCount ?? 0} 則評價</p>
          <Link href="/me/profile" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-campus-moss px-4 py-2 font-black text-campus-moss">
            編輯個人資料
          </Link>
        </article>
      </div>
    </section>
  );
}
