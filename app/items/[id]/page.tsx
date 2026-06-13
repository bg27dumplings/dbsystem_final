import Link from "next/link";
import { ExchangeSummary } from "@/components/exchange-summary";
import { ItemActions } from "@/components/items/item-actions";

import { StarRating } from "@/components/reviews/star-rating";
import { StatusBadge } from "@/components/status-badge";
import { ItemGallery } from "@/components/items/item-gallery";
import { getStudentSession } from "@/lib/auth/student-session";
import { User, Star } from "lucide-react";
import { WishlistButton } from "@/components/items/wishlist-button";
import { findStudentWishlist, findItemById } from "@/lib/marketplace/queries";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, session] = await Promise.all([findItemById(id), getStudentSession()]);
  
  if (!item) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">找不到這筆物品</h1>
        <p className="mt-3 text-slate-700">這筆物品可能已下架、刪除，或根本不存在於資料庫中。</p>
        <Link href="/search" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          回到物品列表
        </Link>
      </section>
    );
  }

  const wishlistIds = session ? await findStudentWishlist(session.studentId) : [];
  const isWished = wishlistIds.includes(item.id);

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
      <ItemGallery images={item.images} title={item.title} />
      <section className="space-y-5 rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10 lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <span className="rounded-full bg-campus-paper px-3 py-1 text-sm font-bold text-campus-ink">{item.category}</span>
          <span className="rounded-full bg-campus-paper px-3 py-1 text-sm font-bold text-campus-ink">{item.condition}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-black leading-tight text-campus-ink">{item.title}</h1>
          <WishlistButton itemId={item.id} initialIsWished={isWished} iconSize={24} className="h-12 w-12 flex-shrink-0 border border-slate-200" />
        </div>
        <div>
          <div className="mt-2 flex items-center gap-3 relative group w-fit">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-campus-ink/10 bg-campus-ink/5 flex-shrink-0 flex items-center justify-center cursor-pointer">
              {item.sellerAvatarUrl ? (
                <img src={item.sellerAvatarUrl} alt={item.seller} className="h-full w-full object-cover" />
              ) : (
                <User size={20} className="text-campus-ink" />
              )}
            </div>
            <Link href={`/profile/${item.sellerId}`} className="cursor-pointer">
              <p className="font-bold text-campus-ink group-hover:underline">{item.seller}</p>
              <p className="text-xs text-slate-500">賣家</p>
            </Link>

            {/* Hover Card */}
            <div className="absolute left-0 top-full z-10 mt-2 w-72 rounded-lg bg-white p-4 shadow-xl ring-1 ring-campus-ink/10 opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:-translate-y-1">
              <div className="flex items-center gap-3 border-b border-campus-ink/5 pb-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-campus-ink/10 bg-campus-ink/5 flex-shrink-0 flex items-center justify-center">
                  {item.sellerAvatarUrl ? (
                    <img src={item.sellerAvatarUrl} alt={item.seller} className="h-full w-full object-cover" />
                  ) : (
                    <User size={24} className="text-campus-ink" />
                  )}
                </div>
                <div>
                  <p className="font-black text-campus-ink">{item.seller}</p>
                  {item.sellerRating && item.sellerRating.reviewCount > 0 ? (
                    <div className="flex flex-wrap items-center gap-1 text-xs text-slate-700">
                      <span className="font-bold text-campus-moss flex items-center gap-0.5">
                        {item.sellerRating.averageRating.toFixed(1)}
                        <Star className="h-3 w-3 fill-campus-gold text-campus-gold" />
                      </span>
                      <span>({item.sellerRating.reviewCount} 則評價)</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">尚未累積評價</p>
                  )}
                </div>
              </div>
              {item.sellerBio && (
                <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{item.sellerBio}</p>
              )}
            </div>
          </div>
        </div>
        <ExchangeSummary exchangeMode={item.exchangeMode} exchangeLabel={item.exchangeLabel} salePrice={item.salePrice} originalPrice={item.originalPrice} />
        <dl className="grid gap-3 rounded-lg bg-campus-paper p-4 text-sm">
          <div>
            <dt className="font-black">交換條件</dt>
            <dd>{item.exchangeLabel}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-black">數量</dt>
            <dd>{item.quantity}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-black">面交地點</dt>
            <dd className="mt-1">{item.location}</dd>
          </div>
        </dl>
        <p className="leading-7 text-slate-700">{item.description}</p>
        <ItemActions itemId={item.id} itemStatus={item.status} isOwnItem={String(session?.studentId) === item.sellerId} />
      </section>
    </article>
  );
}
