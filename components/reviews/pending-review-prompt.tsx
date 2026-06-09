import { ReviewForm } from "@/components/reviews/review-form";
import type { PendingReview } from "@/lib/marketplace/domain/models";

export function PendingReviewPrompt({ reviews }: { reviews: PendingReview[] }) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="pending-reviews-heading" className="mb-5 space-y-3 rounded-lg border border-campus-gold/30 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-black text-campus-moss">交易評價提醒</p>
        <h2 id="pending-reviews-heading" className="text-xl font-black text-campus-ink">
          你有 {reviews.length} 筆交易等待評價
        </h2>
      </div>
      {reviews.map((review) => (
        <ReviewForm key={review.appointmentId} review={review} />
      ))}
    </section>
  );
}
