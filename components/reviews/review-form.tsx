"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/reviews/star-rating";
import type { PendingReview } from "@/lib/marketplace/domain/models";

export function ReviewForm({ review }: { review: PendingReview }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ rating?: string; comment?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: review.appointmentId,
          rating,
          comment
        })
      });

      const result = (await response.json()) as {
        ok: boolean;
        formError?: string;
        fieldErrors?: { rating?: string; comment?: string };
      };

      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "評價送出失敗，請稍後再試。");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      router.refresh();
    } catch {
      setFormError("系統忙碌中，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border border-campus-gold/30 bg-amber-50 p-4" onSubmit={handleSubmit}>
      <p className="text-sm font-black text-campus-moss">待評價交易</p>
      <h3 className="mt-1 text-lg font-black text-campus-ink">{review.itemTitle}</h3>
      <p className="mt-1 text-sm text-slate-700">
        與 {review.counterpartName} 的交易已完成（{review.completedAt}），請留下你的評價。
      </p>
      <div className="mt-4">
        <p className="font-bold">星級評分</p>
        <StarRating value={rating} onChange={setRating} />
        {fieldErrors.rating ? <p className="mt-1 text-sm font-semibold text-campus-red">{fieldErrors.rating}</p> : null}
      </div>
      <div className="mt-4">
        <label htmlFor={`review-comment-${review.appointmentId}`} className="font-bold">
          評價內容
        </label>
        <textarea
          id={`review-comment-${review.appointmentId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
          placeholder="例如：準時面交、物品狀況符合描述"
        />
        {fieldErrors.comment ? <p className="mt-1 text-sm font-semibold text-campus-red">{fieldErrors.comment}</p> : null}
      </div>
      {formError ? <p className="mt-3 text-sm font-semibold text-campus-red" role="alert">{formError}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "送出中..." : "送出評價"}
      </button>
    </form>
  );
}
