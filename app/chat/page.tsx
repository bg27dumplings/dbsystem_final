import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { requireStudentSession } from "@/lib/auth/guards";
import { findChatRoomsByStudentId } from "@/lib/marketplace/queries";

export default async function ChatPage() {
  const session = await requireStudentSession("/chat");
  const rooms = await findChatRoomsByStudentId(session.studentId);

  return (
    <section aria-labelledby="chat-heading" className="space-y-4">
      <div>
        <p className="text-sm font-black text-campus-moss">聊天</p>
        <h1 id="chat-heading" className="text-3xl font-black text-campus-ink">訊息中心</h1>
      </div>
      {rooms.length > 0 ? (
        <div className="grid gap-3">
          {rooms.map((room) => (
            <Link key={room.id} href={`/chat/${room.id}`} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10 hover:shadow-lift">
              <p className="font-black text-campus-ink">{room.counterpartName}</p>
              <p className="mt-1 text-sm font-bold text-campus-moss">關於「{room.itemTitle}」</p>
              <p className="text-sm text-slate-700">{room.lastMessage}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="目前沒有任何聊天室"
          description="等你和其他同學對真實物品開始聯絡後，這裡才會出現訊息紀錄。"
          actionLabel="瀏覽物品"
          actionHref="/search"
        />
      )}
    </section>
  );
}
