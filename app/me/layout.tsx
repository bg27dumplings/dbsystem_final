import { MeSubnav } from "@/components/me/me-subnav";
import { StarRating } from "@/components/reviews/star-rating";
import { requireStudentSession } from "@/lib/auth/guards";
import {
  findAppointmentsByStudentId,
  findItemsByStudentId,
  findPendingAppointmentCount,
  findStudentProfileById,
  countUnreadChatMessages,
  countUnreadAppointments
} from "@/lib/marketplace/queries";
import { Package, CalendarRange, MessageCircle } from "lucide-react";

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStudentSession("/me");
  const [items, appointments, pendingCount, profile, unreadChatCount, unreadAppointmentCount] = await Promise.all([
    findItemsByStudentId(session.studentId),
    findAppointmentsByStudentId(session.studentId),
    findPendingAppointmentCount(session.studentId),
    findStudentProfileById(session.studentId),
    countUnreadChatMessages(session.studentId),
    countUnreadAppointments(session.studentId)
  ]);

  const activeAppointments = appointments.filter((appointment) =>
    ["pending", "accepted"].includes(appointment.status)
  );
  const activeItemsCount = items.filter((item) => item.status === "active").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section aria-labelledby="me-dashboard-heading" className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-campus-ink/10">
        <div className="bg-campus-moss p-6 text-white sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 id="me-dashboard-heading" className="text-3xl font-black">{session.name}</h1>
              <p className="mt-1 text-campus-paper">個人主頁與管理中心</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-black/20 p-3 backdrop-blur">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black">{profile?.rating.averageRating.toFixed(1) ?? "0.0"}</span>
                <div className="flex text-yellow-400">
                  <StarRating value={profile?.rating.averageRating ?? 0} readonly showScore={false} />
                </div>
                <span className="mt-1 text-xs text-white/80">{profile?.rating.reviewCount ?? 0} 則評價</span>
              </div>
            </div>
          </div>
          {profile?.bio && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-campus-paper/90">{profile.bio}</p>
          )}
        </div>
        
        <div className="grid grid-cols-3 divide-x divide-campus-ink/10 bg-slate-50/50">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Package className="mb-2 text-campus-moss" size={24} />
            <span className="text-2xl font-black text-campus-ink">{activeItemsCount}</span>
            <span className="text-xs font-bold text-slate-500">上架中物品</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <CalendarRange className="mb-2 text-campus-moss" size={24} />
            <div className="relative">
              <span className="text-2xl font-black text-campus-ink">{activeAppointments.length}</span>
              {unreadAppointmentCount > 0 && (
                <span className="absolute -right-3 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white" />
              )}
            </div>
            <span className="text-xs font-bold text-slate-500">進行中預約</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <MessageCircle className="mb-2 text-campus-moss" size={24} />
            <div className="relative">
              <span className="text-2xl font-black text-campus-ink">{unreadChatCount}</span>
            </div>
            <span className="text-xs font-bold text-slate-500">未讀訊息</span>
          </div>
        </div>
      </section>

      <MeSubnav unreadChatCount={unreadChatCount} unreadAppointmentCount={unreadAppointmentCount} />
      
      <main>
        {children}
      </main>
    </div>
  );
}
