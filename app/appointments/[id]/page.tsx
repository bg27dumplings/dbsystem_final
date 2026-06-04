import { StatusBadge } from "@/components/status-badge";
import { appointments } from "@/lib/data";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = appointments.find((entry) => entry.id === id) ?? appointments[0];

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
        <div><dt className="font-black">約定金額</dt><dd>NT$ {appointment.amount}</dd></div>
      </dl>
      <form className="grid gap-3">
        <label htmlFor="review" className="font-bold">評論留言</label>
        <textarea id="review" rows={4} className="rounded-md border border-slate-300 px-3 py-3" placeholder="完成或失敗後留下交易狀況" />
        <button className="rounded-md bg-campus-moss px-4 py-3 font-black text-white">送出評論</button>
      </form>
    </section>
  );
}
