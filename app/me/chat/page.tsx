import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { User } from "lucide-react";
import { requireStudentSession } from "@/lib/auth/guards";
import { findChatRoomsByStudentId } from "@/lib/marketplace/queries";

export default async function ChatPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "buy" } = await searchParams;
  const session = await requireStudentSession("/me/chat");
  const rooms = await findChatRoomsByStudentId(session.studentId);

  const buyRooms = rooms.filter((r) => !r.isSeller);
  const sellRooms = rooms.filter((r) => r.isSeller);

  const activeRooms = tab === "sell" ? sellRooms : buyRooms;

  const buyUnread = buyRooms.reduce((acc, curr) => acc + curr.unreadCount, 0);
  const sellUnread = sellRooms.reduce((acc, curr) => acc + curr.unreadCount, 0);

  return (
    <section aria-labelledby="chat-heading" className="space-y-4 max-w-3xl mx-auto">

      <div className="flex border-b border-campus-ink/10">
        <Link
          href="/me/chat?tab=buy"
          className={`flex-1 py-3 text-center font-black border-b-2 text-sm transition-colors ${
            tab === "buy"
              ? "border-campus-moss text-campus-moss"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          買家訊息
          {buyUnread > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] text-white">
              {buyUnread}
            </span>
          )}
        </Link>
        <Link
          href="/me/chat?tab=sell"
          className={`flex-1 py-3 text-center font-black border-b-2 text-sm transition-colors ${
            tab === "sell"
              ? "border-campus-moss text-campus-moss"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          賣家訊息
          {sellUnread > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] text-white">
              {sellUnread}
            </span>
          )}
        </Link>
      </div>

      {activeRooms.length > 0 ? (
        <div className="grid gap-3">
          {activeRooms.map((room) => (
            <Link
              key={room.id}
              href={`/me/chat/${room.id}`}
              className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10 hover:shadow-lift flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 h-10 w-10 overflow-hidden rounded-full border border-campus-ink/10 bg-campus-ink/5 flex items-center justify-center shrink-0">
                  {room.counterpartAvatarUrl ? (
                    <img src={room.counterpartAvatarUrl} alt={room.counterpartName} className="h-full w-full object-cover" />
                  ) : (
                    <User size={20} className="text-campus-ink" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-black text-campus-ink text-base">{room.counterpartName}</p>
                  <p className="text-xs font-bold text-campus-moss">關於：「{room.itemTitle}」</p>
                  <p className="text-sm text-slate-700 leading-normal line-clamp-1">{room.lastMessage}</p>
                </div>
              </div>
              {room.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                  {room.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={tab === "sell" ? "沒有賣家訊息" : "目前沒有任何聊天室"}
          description={
            tab === "sell"
              ? "當有同學對你上架的商品有興趣並發送訊息時，對話紀錄會顯示在這裡。"
              : "等你和其他同學對真實物品開始聯絡後，這裡才會出現訊息紀錄。"
          }
          actionLabel="瀏覽物品"
          actionHref="/search"
        />
      )}
    </section>
  );
}
