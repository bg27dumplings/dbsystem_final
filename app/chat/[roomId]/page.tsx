import Link from "next/link";

export default function ChatRoomPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-lg bg-white shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="chat-room-heading">
      <div className="border-b border-campus-ink/10 p-4">
        <h1 id="chat-room-heading" className="text-xl font-black text-campus-ink">資料庫系統概論課本</h1>
        <p className="text-sm text-slate-700">系統訊息與時間以文字顯示，不只靠 hover。</p>
      </div>
      <ol className="space-y-3 p-4" aria-label="聊天訊息">
        <li className="max-w-[80%] rounded-lg bg-campus-paper p-3">
          <p>您好，請問可以在圖書館面交嗎？</p>
          <time className="text-xs text-slate-600">18:10</time>
        </li>
        <li className="ml-auto max-w-[80%] rounded-lg bg-campus-moss p-3 text-white">
          <p>可以，今晚 18:30。</p>
          <time className="text-xs text-white/80">18:12</time>
        </li>
        <li className="rounded-lg border border-campus-gold bg-amber-50 p-3 text-sm font-bold text-campus-ink">系統：買家已提出面交請求，等待賣家同意。</li>
      </ol>
      <form className="grid gap-3 border-t border-campus-ink/10 p-4 sm:grid-cols-[1fr_auto_auto]">
        <label htmlFor="message" className="sr-only">輸入訊息</label>
        <input id="message" className="rounded-md border border-slate-300 px-3 py-3" placeholder="輸入訊息" />
        <Link href="/appointments" className="inline-flex items-center justify-center rounded-md border border-campus-moss px-4 py-3 font-black text-campus-moss">提出面交</Link>
        <button className="rounded-md bg-campus-moss px-4 py-3 font-black text-white">送出</button>
      </form>
    </section>
  );
}
