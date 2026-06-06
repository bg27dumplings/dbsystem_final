import { StatusBadge } from "@/components/status-badge";
import { appointments } from "@/lib/data";
import { requireStudentSession } from "@/lib/auth/guards";

export default async function AppointmentsPage() {
  await requireStudentSession("/appointments");

  return (
    <section aria-labelledby="appointments-heading" className="space-y-4">
      <div>
        <p className="text-sm font-black text-campus-moss">面交預約</p>
        <h1 id="appointments-heading" className="text-3xl font-black text-campus-ink">預約管理</h1>
      </div>
      <div className="grid gap-3">
        {appointments.map((appointment) => (
          <article key={appointment.id} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={appointment.status} />
              <span className="text-sm font-bold text-slate-700">{appointment.time}</span>
            </div>
            <h2 className="mt-2 text-xl font-black text-campus-ink">{appointment.itemTitle}</h2>
            <p className="text-slate-700">{appointment.location}，約定金額 NT$ {appointment.amount}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-md bg-campus-moss px-3 py-2 font-bold text-white">面交成功</button>
              <button className="rounded-md border border-campus-red px-3 py-2 font-bold text-campus-red">標記失敗</button>
              <button className="rounded-md border border-campus-blue px-3 py-2 font-bold text-campus-blue">評論留言</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
