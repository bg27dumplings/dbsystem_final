import Link from "next/link";
import { ProfileForm } from "@/components/profile/profile-form";
import { StatusBadge } from "@/components/status-badge";
import { requireStudentSession } from "@/lib/auth/guards";
import {
  findAppointmentsByStudentId,
  findChatRoomsByStudentId,
  findStudentProfileById
} from "@/lib/marketplace/queries";
import { MessageSquare, CalendarRange, ArrowRight, Settings } from "lucide-react";

export default async function MeOverviewPage() {
  const session = await requireStudentSession("/me");
  const [profile, appointments, chatRooms] = await Promise.all([
    findStudentProfileById(session.studentId),
    findAppointmentsByStudentId(session.studentId),
    findChatRoomsByStudentId(session.studentId)
  ]);

  const activeAppointments = appointments
    .filter((a) => ["pending", "accepted"].includes(a.status))
    .slice(0, 3);
  const recentChats = chatRooms.slice(0, 3);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        {/* 近期聊天 */}
        <section aria-labelledby="recent-chats-heading" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-campus-ink/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h2 id="recent-chats-heading" className="flex items-center gap-2 text-xl font-black text-campus-ink">
                <MessageSquare className="text-campus-moss" />
                近期訊息
              </h2>
              <Link href="/me/chat" className="text-sm font-bold text-campus-moss hover:text-campus-ink transition-colors flex items-center gap-1">
                全部 <ArrowRight size={16} />
              </Link>
            </div>
            
            {recentChats.length > 0 ? (
              <div className="space-y-3">
                {recentChats.map((room) => (
                  <Link
                    key={room.id}
                    href={`/me/chat/${room.id}`}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors"
                  >
                    <div className="truncate pr-4">
                      <p className="font-bold text-campus-ink truncate">{room.counterpartName}</p>
                      <p className="text-sm text-slate-500 truncate">{room.itemTitle}</p>
                    </div>
                    {room.unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                        {room.unreadCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                目前沒有聊天訊息
              </div>
            )}
          </div>
        </section>

        {/* 近期預約 */}
        <section aria-labelledby="recent-appointments-heading" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-campus-ink/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h2 id="recent-appointments-heading" className="flex items-center gap-2 text-xl font-black text-campus-ink">
                <CalendarRange className="text-campus-moss" />
                進行中預約
              </h2>
              <Link href="/me/appointments" className="text-sm font-bold text-campus-moss hover:text-campus-ink transition-colors flex items-center gap-1">
                全部 <ArrowRight size={16} />
              </Link>
            </div>
            
            {activeAppointments.length > 0 ? (
              <div className="space-y-3">
                {activeAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/me/appointments/${apt.id}`}
                    className="block rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors relative"
                  >
                    {apt.hasUnreadUpdates && (
                      <span className="absolute right-3 top-3 flex h-2 w-2 rounded-full bg-red-500" />
                    )}
                    <div className="flex items-center gap-2 mb-1 pr-6">
                      <StatusBadge status={apt.status} />
                      <span className="text-xs font-bold text-slate-500">{apt.viewerRole === "seller" ? "你是賣家" : "你是買家"}</span>
                    </div>
                    <p className="font-bold text-campus-ink truncate">{apt.itemTitle}</p>
                    <p className="text-sm text-slate-500 truncate">{apt.time}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                目前沒有進行中的預約
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 個人資料設定 */}
      <section aria-labelledby="profile-settings-heading" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <div className="mb-6">
          <h2 id="profile-settings-heading" className="flex items-center gap-2 text-xl font-black text-campus-ink">
            <Settings className="text-slate-400" />
            個人資料設定
          </h2>
          <p className="mt-1 text-sm text-slate-500">更新您的簡介與聯絡資訊，讓其他同學更認識您。</p>
        </div>
        {profile ? (
          <ProfileForm profile={profile} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            找不到個人資料
          </div>
        )}
      </section>
    </div>
  );
}
