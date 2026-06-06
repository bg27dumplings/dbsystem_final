import Link from "next/link";
import { items } from "@/lib/data";
import { requireStudentSession } from "@/lib/auth/guards";

export default async function ChatPage() {
  await requireStudentSession("/chat");

  return (
    <section aria-labelledby="chat-heading" className="space-y-4">
      <div>
        <p className="text-sm font-black text-campus-moss">聊天</p>
        <h1 id="chat-heading" className="text-3xl font-black text-campus-ink">訊息中心</h1>
      </div>
      <div className="grid gap-3">
        {items.slice(0, 3).map((item) => (
          <Link key={item.id} href={`/chat/${item.id}`} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10 hover:shadow-lift">
            <p className="font-black text-campus-ink">{item.seller}</p>
            <p className="text-sm text-slate-700">關於「{item.title}」：請問今天晚上可以面交嗎？</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
