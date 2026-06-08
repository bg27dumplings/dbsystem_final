"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ReviewResponse = {
  ok: boolean;
  formError?: string;
  fieldErrors?: {
    rating?: string;
    comment?: string;
  };
};

export function AppointmentReviewForm({
  appointmentId,
  revieweeName
}: {
  appointmentId: string;
  revieweeName: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ rating?: string; comment?: string }>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    setFieldErrors({});

    try {
      const response = await fetch(`/api/appointments/${encodeURIComponent(appointmentId)}/reviews`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ rating, comment })
      });

      const result = (await response.json()) as ReviewResponse;
      if (!response.ok || !result.ok) {
        setFormError(result.formError ?? "評價送出失敗，請稍後再試。");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setComment("");
      setRating("5");
      router.refresh();
    } catch {
      setFormError("評價送出失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4 rounded-lg border border-campus-ink/10 bg-white p-4" onSubmit={handleSubmit} noValidate>
      <div>
        <h2 className="text-lg font-black text-campus-ink">留下評價</h2>
        <p className="mt-1 text-sm text-slate-700">你將對 {revieweeName} 留下這筆交易的評價。</p>
      </div>
      {formError ? (
        <p className="rounded-lg border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red" role="alert">
          {formError}
        </p>
      ) : null}
      <div>
        <label htmlFor="review-rating" className="font-bold text-campus-ink">
          評分
        </label>
        <select
          id="review-rating"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
          aria-invalid={fieldErrors.rating ? "true" : "false"}
          aria-describedby={fieldErrors.rating ? "review-rating-error" : undefined}
        >
          <option value="5">5 分</option>
          <option value="4">4 分</option>
          <option value="3">3 分</option>
          <option value="2">2 分</option>
          <option value="1">1 分</option>
        </select>
        {fieldErrors.rating ? <p id="review-rating-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.rating}</p> : null}
      </div>
      <div>
        <label htmlFor="review-comment" className="font-bold text-campus-ink">
          評價內容
        </label>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
          placeholder="例如：準時面交、溝通清楚、物品描述一致"
          aria-invalid={fieldErrors.comment ? "true" : "false"}
          aria-describedby={fieldErrors.comment ? "review-comment-error" : undefined}
        />
        {fieldErrors.comment ? <p id="review-comment-error" className="mt-2 text-sm font-semibold text-campus-red">{fieldErrors.comment}</p> : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "送出中..." : "送出評價"}
      </button>
    </form>
  );
}
