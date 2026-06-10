import Link from "next/link";
import { requireStudentSession } from "@/lib/auth/guards";
import { findChatRoomByIdForStudent } from "@/lib/marketplace/queries";
import { findChatRoomParticipantById } from "@/lib/marketplace/infrastructure/chat-repository";
import { getStudentStats } from "@/lib/auth/student-repository";
import { ChatRoom } from "@/components/chat/chat-room";

export default async function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const session = await requireStudentSession(`/me/chat/${roomId}`);
  
  const [room, participant] = await Promise.all([
    findChatRoomByIdForStudent(session.studentId, roomId),
    findChatRoomParticipantById(roomId)
  ]);

  if (!room || !participant) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">找不到這個聊天室</h1>
        <p className="mt-3 text-slate-700">這個聊天室可能不存在，或你目前沒有權限查看。</p>
        <Link href="/me/chat" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          回到訊息中心
        </Link>
      </section>
    );
  }

  const counterpartId = participant.buyer_id === session.studentId ? participant.seller_id : participant.buyer_id;
  const counterpartStats = await getStudentStats(counterpartId);

  return (
    <div className="mx-auto max-w-3xl">
      <ChatRoom
        roomId={room.roomId}
        itemId={room.itemId}
        itemTitle={room.itemTitle}
        counterpartName={room.counterpartName}
        counterpartAvatarUrl={room.counterpartAvatarUrl}
        counterpartStats={counterpartStats}
        initialMessages={room.messages}
        currentStudentId={session.studentId}
      />
    </div>
  );
}
