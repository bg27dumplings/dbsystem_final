import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ExchangeSummary } from "@/components/exchange-summary";
import { ImageViewer } from "@/components/image-viewer";
import { StatusBadge } from "@/components/status-badge";
import { User } from "lucide-react";
import { requireStudentSession } from "@/lib/auth/guards";
import { findAppointmentsByStudentId } from "@/lib/marketplace/queries";

export default async function MyAppointmentsPage({
  searchParams
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await requireStudentSession("/me/appointments");
  const params = await searchParams;
  const tab = params?.tab === "seller" ? "seller" : "buyer";
  const allAppointments = await findAppointmentsByStudentId(session.studentId);
  const appointments = allAppointments.filter((a) => a.viewerRole === tab);

  return (
    <section aria-labelledby="appointments-heading" className="space-y-4">
      <div className="flex border-b border-campus-ink/10">
        <Link
          href="/me/appointments?tab=buyer"
          className={`flex-1 py-3 text-center font-black border-b-2 text-sm transition-colors ${
            tab === "buyer" ? "border-campus-moss text-campus-moss" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          買家預約
        </Link>
        <Link
          href="/me/appointments?tab=seller"
          className={`flex-1 py-3 text-center font-black border-b-2 text-sm transition-colors ${
            tab === "seller" ? "border-campus-moss text-campus-moss" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          賣家預約
        </Link>
      </div>

      {appointments.length > 0 ? (
        <div className="grid gap-3">
          {appointments.map((appointment) => (
            <article key={appointment.id} className="relative rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10">
              {appointment.hasUnreadUpdates && (
                <span className="absolute right-4 top-4 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                </span>
              )}
              <div className="flex gap-4">
                {appointment.imageUrl && (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-slate-200">
                    <ImageViewer
                      src={appointment.imageUrl}
                      alt={appointment.itemTitle}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={appointment.status} />
                    <span className="text-sm font-bold text-slate-700">{appointment.time}</span>
                  </div>
                    <h2 className="mt-2 text-xl font-black text-campus-ink">{appointment.itemTitle}</h2>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-6 w-6 overflow-hidden rounded-full border border-campus-ink/10 bg-campus-ink/5 flex items-center justify-center shrink-0">
                        {tab === "buyer" ? (
                          appointment.sellerAvatarUrl ? (
                            <img src={appointment.sellerAvatarUrl} alt={appointment.seller} className="h-full w-full object-cover" />
                          ) : (
                            <User size={12} className="text-campus-ink" />
                          )
                        ) : (
                          appointment.buyerAvatarUrl ? (
                            <img src={appointment.buyerAvatarUrl} alt={appointment.buyer} className="h-full w-full object-cover" />
                          ) : (
                            <User size={12} className="text-campus-ink" />
                          )
                        )}
                      </div>
                      <p className="text-sm text-slate-700 font-medium">
                        {tab === "buyer" ? `賣家：${appointment.seller}` : `買家：${appointment.buyer}`}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{appointment.location}</p>
                  <div className="mt-2">
                    <ExchangeSummary exchangeMode={appointment.exchangeMode} exchangeLabel={appointment.exchangeLabel} />
                  </div>
                  {appointment.note ? <p className="mt-2 text-sm text-slate-700">{appointment.note}</p> : null}
                </div>
              </div>
              <Link
                href={`/me/appointments/${appointment.id}`}
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-md border border-campus-moss px-4 py-3 font-black text-campus-moss hover:bg-campus-paper"
              >
                查看詳情
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="目前沒有任何面交預約"
          description={tab === "buyer" ? "你還沒有提出過任何面交預約。" : "目前還沒有人對你的物品提出面交預約。"}
          actionLabel="前往物品列表"
          actionHref="/search"
        />
      )}
    </section>
  );
}
