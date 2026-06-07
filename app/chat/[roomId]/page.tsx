import Link from "next/link";
import { requireStudentSession } from "@/lib/auth/guards";
import { findChatRoomByIdForStudent } from "@/lib/marketplace/queries";

export default async function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const session = await requireStudentSession("/chat");
  const { roomId } = await params;
  const room = await findChatRoomByIdForStudent(session.studentId, roomId);
  if (!room) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">找不到這個聊天室</h1>
        <p className="mt-3 text-slate-700">這個聊天室可能不存在，或你目前沒有權限查看。</p>
        <Link href="/chat" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          回到訊息中心
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-lg bg-white shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="chat-room-heading">
      <div className="border-b border-campus-ink/10 p-4">
        <h1 id="chat-room-heading" className="text-xl font-black text-campus-ink">{room.itemTitle}</h1>
        <p className="text-sm text-slate-700">只有真實聊天資料才會顯示在這裡，不再回退假訊息內容。</p>
      </div>
      <ol className="space-y-3 p-4" aria-label="聊天訊息">
        {room.messages.length > 0 ? room.messages.map((message) => (
          <li
            key={message.id}
            className={
              message.messageType === "system"
                ? "rounded-lg border border-campus-gold bg-amber-50 p-3 text-sm font-bold text-campus-ink"
                : message.isMine
                  ? "ml-auto max-w-[80%] rounded-lg bg-campus-moss p-3 text-white"
                  : "max-w-[80%] rounded-lg bg-campus-paper p-3"
            }
          >
            <p>{message.body}</p>
            <time className={`text-xs ${message.isMine ? "text-white/80" : "text-slate-600"}`}>{message.time}</time>
          </li>
        )) : (
          <li className="rounded-lg border border-dashed border-campus-ink/15 bg-slate-50 p-4 text-sm text-slate-700">
            這個聊天室目前還沒有任何訊息。
          </li>
        )}
      </ol>
      <div className="grid gap-3 border-t border-campus-ink/10 p-4 sm:grid-cols-[1fr_auto]">
        <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          即時傳訊與提出面交的送出流程尚未接到真實後端；目前這裡只顯示真實聊天室資料。
        </div>
        <Link href="/appointments" className="inline-flex items-center justify-center rounded-md border border-campus-moss px-4 py-3 font-black text-campus-moss">
          查看預約
        </Link>
      </div>
    </section>
  );
}
