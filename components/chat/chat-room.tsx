"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  itemTitle: string;
  counterpartName: string;
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
  itemTitle,
  counterpartName,
  counterpartStats,
  initialMessages,
  currentStudentId
}: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
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

  async function handleRecall(messageId: string) {
    if (!window.confirm("確定要收回此訊息嗎？")) return;

    try {
      const res = await fetch(`/api/chat/messages/${encodeURIComponent(messageId)}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        alert(result.formError ?? "收回失敗。");
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, messageType: "recalled", body: "訊息已收回" }
            : m
        )
      );
      router.refresh();
    } catch {
      alert("系統忙碌中，收回失敗。");
    }
  }

  async function handleEditSave(messageId: string) {
    if (!editingText.trim()) return;

    try {
      const res = await fetch(`/api/chat/messages/${encodeURIComponent(messageId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editingText })
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        alert(result.formError ?? "編輯失敗。");
        return;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, body: editingText, isEdited: true } : m))
      );
      setEditingMessageId(null);
      setEditingText("");
      router.refresh();
    } catch {
      alert("系統忙碌中，編輯失敗。");
    }
  }

  return (
    <div className="flex flex-col rounded-lg bg-white shadow-sm ring-1 ring-campus-ink/10 h-[600px]">
      {/* Header */}
      <div className="border-b border-campus-ink/10 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            ← 返回
          </Link>
          <div>
            <h1 className="text-lg font-black text-campus-ink leading-tight">{itemTitle}</h1>
            <p className="text-xs text-slate-500 mt-1">
              與 <span className="font-bold text-campus-moss">{counterpartName}</span> 的對話
              <span className="ml-2 text-slate-400">|</span>
              <span className="ml-2">已交易 {counterpartStats.totalDeals} 次</span>
              <span className="ml-2">
                評價 {counterpartStats.avgRating !== null ? `${counterpartStats.avgRating} ★` : "暫無"}
              </span>
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 hidden sm:block">即時對話視窗</p>
      </div>

      {/* Messages Scroll Area */}
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
                  {editingMessageId === message.id ? (
                    <div className="space-y-2 text-campus-ink">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full rounded border border-slate-300 p-1 text-sm bg-white"
                        rows={2}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded font-bold"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleEditSave(message.id)}
                          className="px-2 py-1 bg-campus-gold text-white text-xs rounded font-bold"
                        >
                          儲存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap break-words">
                        {message.body}
                        {message.isEdited && (
                          <span className="text-[10px] opacity-70 ml-2 italic select-none">(已編輯)</span>
                        )}
                      </p>
                      {isMine && (
                        <div className="opacity-0 group-hover:opacity-100 absolute -left-20 top-1/2 -translate-y-1/2 flex gap-1 bg-white p-1 rounded shadow-md ring-1 ring-slate-200 text-xs text-slate-600 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingMessageId(message.id);
                              setEditingText(message.body);
                            }}
                            className="hover:text-campus-moss px-1 font-bold"
                          >
                            編輯
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => handleRecall(message.id)}
                            className="hover:text-campus-red px-1 font-bold"
                          >
                            收回
                          </button>
                        </div>
                      )}
                    </>
                  )}
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
