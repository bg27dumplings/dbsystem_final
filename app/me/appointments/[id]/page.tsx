import Link from "next/link";
import { AppointmentActions } from "@/components/appointments/appointment-actions";
import { CampusMapDisplay } from "@/components/location/campus-map-display";
import { ExchangeSummary } from "@/components/exchange-summary";
import { MeSubnav } from "@/components/me/me-subnav";
import { ReviewForm } from "@/components/reviews/review-form";
import { StatusBadge } from "@/components/status-badge";
import { requireStudentSession } from "@/lib/auth/guards";
import { findAppointmentByIdForStudent, findPendingReviews } from "@/lib/marketplace/queries";

export default async function MyAppointmentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireStudentSession(`/me/appointments/${id}`);
  const [appointment, pendingReviews] = await Promise.all([
    findAppointmentByIdForStudent(session.studentId, id),
    findPendingReviews(session.studentId)
  ]);

  if (!appointment) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">找不到這筆預約</h1>
        <p className="mt-3 text-slate-700">這筆預約可能不存在，或不屬於你目前登入的帳號。</p>
        <Link href="/me/appointments" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          回到我的預約
        </Link>
      </section>
    );
  }

  const pendingReview = pendingReviews.find((review) => review.appointmentId === appointment.id);

  return (
    <section className="mx-auto max-w-3xl space-y-4" aria-labelledby="appointment-heading">
      <MeSubnav active="appointments" />
      {query?.created === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
          面交預約已送出，賣家會在聊天室與「我的預約」收到通知。
        </div>
      ) : null}
      <article className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={appointment.status} />
          <span className="rounded-full bg-campus-paper px-2.5 py-1 text-xs font-bold text-campus-ink">
            {appointment.viewerRole === "seller" ? "你是賣家" : "你是買家"}
          </span>
          <span className="text-sm font-bold text-slate-700">預約編號 {id}</span>
        </div>
        <div>
          <p className="text-sm font-black text-campus-moss">面交預約詳情</p>
          <h1 id="appointment-heading" className="text-3xl font-black text-campus-ink">{appointment.itemTitle}</h1>
        </div>
        <dl className="grid gap-3 rounded-lg bg-campus-paper p-4 sm:grid-cols-2">
          <div><dt className="font-black">買家</dt><dd>{appointment.buyer}</dd></div>
          <div><dt className="font-black">賣家</dt><dd>{appointment.seller}</dd></div>
          <div><dt className="font-black">時間</dt><dd>{appointment.time}</dd></div>
          <div className="sm:col-span-2">
            <dt className="font-black">地點</dt>
            <dd className="mt-1">
              <CampusMapDisplay location={appointment.location} mapPoint={appointment.mapPoint} />
            </dd>
          </div>
          <div>
            <dt className="font-black">交換方式</dt>
            <dd className="mt-1">
              <ExchangeSummary exchangeMode={appointment.exchangeMode} exchangeLabel={appointment.exchangeLabel} />
            </dd>
          </div>
          {appointment.note ? <div className="sm:col-span-2"><dt className="font-black">備註</dt><dd>{appointment.note}</dd></div> : null}
        </dl>
        <AppointmentActions appointmentId={appointment.id} status={appointment.status} viewerRole={appointment.viewerRole} />
        {appointment.status === "completed" && pendingReview ? <ReviewForm review={pendingReview} /> : null}
        {appointment.status === "accepted" ? (
          <p className="rounded-lg border border-campus-ink/10 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            面交時間過後，系統會自動將預約標記為已完成，並提醒你為對方留下評價。
          </p>
        ) : null}
      </article>
    </section>
  );
}
