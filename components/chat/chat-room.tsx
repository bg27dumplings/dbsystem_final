"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Star } from "lucide-react";

type ChatMessage = {
  id: string;
  body: string;
  time: string;
  isMine: boolean;
  messageType: string;
  isEdited?: boolean;
};

type ChatRoomProps = {
  roomId: string;
  itemId: number;
  itemTitle: string;
  counterpartName: string;
  counterpartAvatarUrl?: string;
  counterpartStats: {
    totalDeals: number;
    avgRating: number | null;
    totalReviews: number;
  };
  initialMessages: ChatMessage[];
  currentStudentId: number;
};

export function ChatRoom({
  roomId,
  itemId,
  itemTitle,
  counterpartName,
  counterpartAvatarUrl,
  counterpartStats,
  initialMessages,
  currentStudentId
}: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");

  const [formError, setFormError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    // Also trigger router.refresh() on mount to clear global unread count badge
    router.refresh();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.messages) {
            // Check if length of messages changed, or any bodies changed
            const messagesChanged = 
              data.messages.length !== messages.length || 
              JSON.stringify(data.messages) !== JSON.stringify(messages);

            if (messagesChanged) {
              setMessages(data.messages);
              // Trigger layout refresh so header notifications updates
              router.refresh();
              // Scroll to bottom if new messages arrived
              if (data.messages.length > messages.length) {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to poll messages:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId, messages.length, messages, router]);

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;

    setIsSending(true);
    setFormError("");

    try {
      const res = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body })
      });

      const result = await res.json();
      if (!res.ok || !result.ok) {
        setFormError(result.formError ?? "訊息傳送失敗。");
        return;
      }

      setBody("");
      // Immediately fetch messages to show it
      const pollRes = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`);
      if (pollRes.ok) {
        const data = await pollRes.json();
        if (data.ok && data.messages) {
          setMessages(data.messages);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
        }
      }
      router.refresh();
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
    } finally {
      setIsSending(false);
    }
  }



  return (
    <div className="flex flex-col rounded-lg bg-white shadow-sm ring-1 ring-campus-ink/10 h-[600px]">
      {/* Header */}
      <div className="border-b border-campus-ink/10 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/me/chat"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            ← 返回
          </Link>
          <div className="flex items-center gap-3 ml-2 relative group w-fit">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-campus-ink/10 bg-campus-ink/5 flex items-center justify-center shrink-0">
                {counterpartAvatarUrl ? (
                  <img src={counterpartAvatarUrl} alt={counterpartName} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <User size={20} className="text-campus-ink transition-transform group-hover:scale-110" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-black text-campus-ink leading-tight">{itemTitle}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  與 <span className="font-bold group-hover:text-campus-moss transition-colors">{counterpartName}</span> 的對話
                  <span className="ml-2 text-slate-400">|</span>
                  <span className="ml-2">已交易 {counterpartStats.totalDeals} 次</span>
                  <span className="ml-2 flex items-center gap-0.5">
                    評價 {counterpartStats.avgRating !== null ? (
                      <>
                        {counterpartStats.avgRating}
                        <Star className="h-3 w-3 fill-campus-gold text-campus-gold" />
                      </>
                    ) : "暫無"}
                  </span>
                </p>
              </div>
            </div>
            <div className="absolute left-0 top-full z-10 mt-2 w-80 rounded-lg bg-white p-4 shadow-xl ring-1 ring-campus-ink/10 opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:-translate-y-1">
              <div className="flex justify-between space-x-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-campus-ink/10 bg-campus-ink/5 flex items-center justify-center shrink-0">
                  {counterpartAvatarUrl ? (
                    <img src={counterpartAvatarUrl} alt={counterpartName} className="h-full w-full object-cover" />
                  ) : (
                    <User size={24} className="text-campus-ink" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-campus-ink">{counterpartName}</h4>
                  <div className="flex items-center pt-2 gap-4">
                    <div className="flex items-center text-xs text-slate-500">
                      <span className="font-bold text-campus-moss mr-1 flex items-center gap-0.5">
                        {counterpartStats.avgRating ?? "0.0"}
                        <Star className="h-3 w-3 fill-campus-gold text-campus-gold" />
                      </span> 評價
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                      <span className="font-bold text-campus-moss mr-1">{counterpartStats.totalReviews}</span> 則評論
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                      <span className="font-bold text-campus-moss mr-1">{counterpartStats.totalDeals}</span> 筆交易
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href={`/appointments/new?itemId=${itemId}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-campus-moss px-3 text-sm font-bold text-white hover:bg-campus-ink"
          >
            建立預約
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isSystem = message.messageType === "system";
            const isRecalled = message.messageType === "recalled";
            const isMine = message.isMine;

            if (isSystem) {
              return (
                <div key={message.id} className="rounded-lg border border-campus-gold bg-amber-50 p-3 text-sm font-bold text-campus-ink">
                  <p>{message.body}</p>
                  <time className="text-xs text-slate-500 block mt-1">{message.time}</time>
                </div>
              );
            }

            if (isRecalled) {
              return (
                <div
                  key={message.id}
                  className={`flex flex-col max-w-[80%] ${isMine ? "ml-auto items-end" : "items-start"}`}
                >
                  <div className="rounded-lg p-2.5 bg-slate-200 text-slate-500 text-xs italic">
                    {isMine ? "您已收回訊息" : "對方已收回訊息"}
                  </div>
                  <time className="text-[10px] text-slate-400 mt-1 block px-1">{message.time}</time>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex flex-col group max-w-[80%] ${isMine ? "ml-auto items-end" : "items-start"}`}
              >
                <div
                  className={`rounded-lg p-3 relative ${
                    isMine ? "bg-campus-moss text-white animate-fade-in" : "bg-campus-paper text-campus-ink ring-1 ring-campus-ink/5"
                  }`}
                >
                      <p className="whitespace-pre-wrap break-words">
                        {message.body}
                        {message.isEdited && (
                          <span className="text-[10px] opacity-70 ml-2 italic select-none">(已編輯)</span>
                        )}
                      </p>
                </div>
                <time className="text-[10px] text-slate-400 mt-1 block px-1">{message.time}</time>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-campus-ink/15 bg-white p-6 text-center text-sm text-slate-500">
            這個聊天室目前還沒有任何訊息。
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer / Composer */}
      <form onSubmit={handleSend} className="border-t border-campus-ink/10 p-4 bg-white space-y-3" noValidate>
        {formError ? (
          <p className="rounded-lg border border-campus-red/20 bg-rose-50 px-3 py-2 text-xs font-semibold text-campus-red">
            {formError}
          </p>
        ) : null}

        <textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="輸入您想發送的訊息..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-campus-moss focus:ring-1 focus:ring-campus-moss"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSending || !body.trim()}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-campus-moss px-5 text-sm font-black text-white hover:bg-campus-ink disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isSending ? "傳送中..." : "送出訊息"}
          </button>
        </div>
      </form>
    </div>
  );
}
