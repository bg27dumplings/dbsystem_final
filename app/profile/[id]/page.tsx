import { notFound } from "next/navigation";
import { findPublicStudentProfile } from "@/lib/marketplace/infrastructure/student-profile-repository";
import { findReviewsForStudent } from "@/lib/marketplace/infrastructure/review-repository";
import { StarRating } from "@/components/reviews/star-rating";
import { User, MessageSquare } from "lucide-react";

export default async function PublicProfilePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = parseInt(id, 10);
  
  if (isNaN(studentId)) {
    notFound();
  }

  const profile = await findPublicStudentProfile(studentId);
  if (!profile) {
    notFound();
  }

  const reviews = await findReviewsForStudent(studentId);
  const buyerReviews = reviews.filter((r) => r.role === "buyer");
  const sellerReviews = reviews.filter((r) => r.role === "seller");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-8 rounded-2xl bg-white p-6 md:p-8 shadow-sm ring-1 ring-campus-ink/10 flex flex-col md:flex-row items-center gap-6">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md bg-campus-ink/5 flex items-center justify-center">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={`${profile.name} 的頭像`} className="h-full w-full object-cover" />
          ) : (
            <User size={48} className="text-campus-ink" />
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-black text-campus-ink">{profile.name}</h1>
          <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
            <StarRating value={profile.rating.averageRating} readonly showScore={false} />
            <span className="text-sm font-bold text-slate-600">({profile.rating.reviewCount} 則評價)</span>
          </div>
          {profile.bio ? (
            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{profile.bio}</p>
          ) : (
            <p className="mt-4 text-sm text-slate-400 italic">這個人很懶，還沒有寫自介。</p>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-campus-ink border-b pb-2">
            做為賣家的評價 ({sellerReviews.length})
          </h2>
          {sellerReviews.length > 0 ? (
            <div className="space-y-4">
              {sellerReviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-campus-ink/5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{review.reviewerName}</p>
                      <p className="text-xs text-slate-500">購買：{review.itemTitle}</p>
                    </div>
                    <StarRating value={review.rating} readonly />
                  </div>
                  <p className="text-sm text-slate-700">{review.comment}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              尚無賣家評價
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-campus-ink border-b pb-2">
            做為買家的評價 ({buyerReviews.length})
          </h2>
          {buyerReviews.length > 0 ? (
            <div className="space-y-4">
              {buyerReviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-campus-ink/5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{review.reviewerName}</p>
                      <p className="text-xs text-slate-500">出售：{review.itemTitle}</p>
                    </div>
                    <StarRating value={review.rating} readonly />
                  </div>
                  <p className="text-sm text-slate-700">{review.comment}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              尚無買家評價
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
