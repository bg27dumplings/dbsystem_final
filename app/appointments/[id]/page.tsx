import Link from "next/link";
import { AppointmentReviewForm } from "@/components/appointments/appointment-review-form";
import { AppointmentStatusActions } from "@/components/appointments/appointment-status-actions";
import { ExchangeSummary } from "@/components/exchange-summary";
import { StatusBadge } from "@/components/status-badge";
import { requireStudentSession } from "@/lib/auth/guards";
import { findAppointmentDetailByIdForStudent } from "@/lib/marketplace/queries";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireStudentSession(`/appointments/${id}`);
  const appointment = await findAppointmentDetailByIdForStudent(session.studentId, id);
  if (!appointment) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">找不到這筆預約</h1>
        <p className="mt-3 text-slate-700">這筆預約可能不存在，或不屬於你目前登入的帳號。</p>
        <Link href="/appointments" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          回到預約列表
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="appointment-heading">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={appointment.status} />
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
        <div><dt className="font-black">地點</dt><dd>{appointment.location}</dd></div>
        <div>
          <dt className="font-black">交換方式</dt>
          <dd className="mt-1">
            <ExchangeSummary exchangeMode={appointment.exchangeMode} exchangeLabel={appointment.exchangeLabel} />
          </dd>
        </div>
        {appointment.note ? <div><dt className="font-black">備註</dt><dd>{appointment.note}</dd></div> : null}
      </dl>
      <AppointmentStatusActions
        appointmentId={appointment.id}
        canAccept={appointment.canAccept}
        canReject={appointment.canReject}
        canCancel={appointment.canCancel}
        canComplete={appointment.canComplete}
        canFail={appointment.canFail}
      />
      <section className="space-y-3 rounded-lg border border-campus-ink/10 bg-slate-50 p-4" aria-labelledby="appointment-reviews-heading">
        <h2 id="appointment-reviews-heading" className="text-lg font-black text-campus-ink">交易評價</h2>
        {appointment.reviews.length > 0 ? (
          <div className="grid gap-3">
            {appointment.reviews.map((review) => (
              <article key={review.id} className="rounded-lg bg-white p-4 ring-1 ring-campus-ink/10">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-campus-ink">{review.reviewerName}</p>
                  <span className="text-sm font-bold text-campus-moss">{`${review.rating} / 5`}</span>
                  <time className="text-sm text-slate-600">{review.createdAt}</time>
                </div>
                <p className="mt-2 text-sm text-slate-700">評價對象：{review.revieweeName}</p>
                <p className="mt-2 leading-7 text-slate-700">{review.comment}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-700">這筆交易目前還沒有任何評價。</p>
        )}
        {appointment.canReview ? (
          <AppointmentReviewForm
            appointmentId={appointment.id}
            revieweeName={appointment.isBuyer ? appointment.seller : appointment.buyer}
          />
        ) : null}
        {appointment.status === "completed" && appointment.hasReviewed ? (
          <p className="text-sm font-semibold text-slate-700">你已經提交過這筆交易的評價。</p>
        ) : null}
      </section>
    </section>
  );
}
