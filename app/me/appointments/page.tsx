import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ExchangeSummary } from "@/components/exchange-summary";
import { MeSubnav } from "@/components/me/me-subnav";
import { StatusBadge } from "@/components/status-badge";
import { requireStudentSession } from "@/lib/auth/guards";
import { findAppointmentsByStudentId } from "@/lib/marketplace/queries";

export default async function MyAppointmentsPage() {
  const session = await requireStudentSession("/me/appointments");
  const appointments = await findAppointmentsByStudentId(session.studentId);

  return (
    <section aria-labelledby="appointments-heading" className="space-y-4">
      <div>
        <p className="text-sm font-black text-campus-moss">我的</p>
        <h1 id="appointments-heading" className="text-3xl font-black text-campus-ink">我的預約</h1>
        <p className="mt-2 text-slate-700">買家與賣家都能在這裡查看面交預約狀態。</p>
      </div>
      <MeSubnav active="appointments" />
      {appointments.length > 0 ? (
        <div className="grid gap-3">
          {appointments.map((appointment) => (
            <article key={appointment.id} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={appointment.status} />
                <span className="rounded-full bg-campus-paper px-2.5 py-1 text-xs font-bold text-campus-ink">
                  {appointment.viewerRole === "seller" ? "你是賣家" : "你是買家"}
                </span>
                <span className="text-sm font-bold text-slate-700">{appointment.time}</span>
              </div>
              <h2 className="mt-2 text-xl font-black text-campus-ink">{appointment.itemTitle}</h2>
              <p className="text-sm text-slate-700">
                買家：{appointment.buyer}／賣家：{appointment.seller}
              </p>
              <p className="text-sm text-slate-700">{appointment.location}</p>
              <div className="mt-2">
                <ExchangeSummary exchangeMode={appointment.exchangeMode} exchangeLabel={appointment.exchangeLabel} />
              </div>
              {appointment.note ? <p className="mt-2 text-sm text-slate-700">{appointment.note}</p> : null}
              <Link
                href={`/me/appointments/${appointment.id}`}
                className="mt-3 inline-flex min-h-12 items-center justify-center rounded-md border border-campus-moss px-4 py-3 font-black text-campus-moss hover:bg-campus-paper"
              >
                查看詳情
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="目前沒有任何面交預約"
          description="提出或收到面交預約後，這裡會顯示完整狀態。"
          actionLabel="前往物品列表"
          actionHref="/search"
        />
      )}
    </section>
  );
}
