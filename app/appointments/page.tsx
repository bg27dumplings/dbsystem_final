import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { requireStudentSession } from "@/lib/auth/guards";
import { findAppointmentsByStudentId } from "@/lib/marketplace/queries";

export default async function AppointmentsPage() {
  const session = await requireStudentSession("/appointments");
  const appointments = await findAppointmentsByStudentId(session.studentId);

  return (
    <section aria-labelledby="appointments-heading" className="space-y-4">
      <div>
        <p className="text-sm font-black text-campus-moss">面交預約</p>
        <h1 id="appointments-heading" className="text-3xl font-black text-campus-ink">預約管理</h1>
      </div>
      {appointments.length > 0 ? (
        <div className="grid gap-3">
          {appointments.map((appointment) => (
            <article key={appointment.id} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={appointment.status} />
                <span className="text-sm font-bold text-slate-700">{appointment.time}</span>
              </div>
              <h2 className="mt-2 text-xl font-black text-campus-ink">{appointment.itemTitle}</h2>
              <p className="text-slate-700">{appointment.location}，約定金額 NT$ {appointment.amount}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="目前沒有任何面交預約"
          description="只有建立過真實預約後，這裡才會出現你的預約紀錄。"
          actionLabel="前往物品列表"
          actionHref="/search"
        />
      )}
    </section>
  );
}
