"use client";

import { FormEvent, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

type SendChatMessageResponse = {
  ok: boolean;
  formError?: string;
  fieldErrors?: {
    body?: string;
  };
};

export function ChatComposer({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSpeechResult = useCallback((text: string, isFinal: boolean) => {
    setBody((prev) => prev + text);
  }, []);
  const { isListening, startListening, stopListening, hasSupport } = useSpeechRecognition(handleSpeechResult);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldError("");
    setFormError("");

    try {
      const response = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ body })
      });

      const result = (await response.json()) as SendChatMessageResponse;
      if (!response.ok || !result.ok) {
        setFieldError(result.fieldErrors?.body ?? "");
        setFormError(result.formError ?? "訊息送出失敗，請稍後再試。");
        return;
      }

      setBody("");
      router.refresh();
    } catch {
      setFormError("訊息送出失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3 border-t border-campus-ink/10 p-4" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <p className="rounded-lg border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </p>
      ) : null}
      <label htmlFor="chat-body" className="font-black text-campus-ink">
        傳送訊息
      </label>
      <textarea
        id="chat-body"
        name="body"
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-3"
        placeholder="輸入你想詢問的內容"
        aria-invalid={fieldError ? "true" : "false"}
        aria-describedby={fieldError ? "chat-body-error" : undefined}
      />
      {fieldError ? (
        <p id="chat-body-error" className="text-sm font-semibold text-campus-red">
          {fieldError}
        </p>
      ) : null}
      <div className="flex justify-between items-center">
        <div>
          {hasSupport ? (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                isListening ? "bg-rose-100 text-rose-600 animate-pulse" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              {isListening ? "停止錄音" : "語音輸入"}
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "送出中..." : "送出訊息"}
        </button>
      </div>
    </form>
  );
}
