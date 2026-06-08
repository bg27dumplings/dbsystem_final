import Link from "next/link";
import { ExchangeSummary } from "@/components/exchange-summary";
import { ItemActions } from "@/components/items/item-actions";
import { StatusBadge } from "@/components/status-badge";
import { findItemById } from "@/lib/marketplace/queries";
import { getStudentStats } from "@/lib/auth/student-repository";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await findItemById(id);
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

  const stats = await getStudentStats(Number(item.sellerId));

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
      <section aria-label="物品照片" className="grid gap-3 sm:grid-cols-2">
        {item.images.length > 0 ? item.images.map((src, index) => (
          <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-campus-ink/10">
            <img src={src} alt={`${item.title} 照片 ${index + 1}`} className="h-full w-full object-cover" />
          </div>
        )) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-white px-6 text-center text-sm font-bold text-campus-ink/70 shadow-sm ring-1 ring-campus-ink/10 sm:col-span-2">
            目前沒有上傳任何圖片。
          </div>
        )}
      </section>
      <section className="space-y-5 rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10 lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <span className="rounded-full bg-campus-paper px-3 py-1 text-sm font-bold text-campus-ink">{item.category}</span>
          <span className="rounded-full bg-campus-paper px-3 py-1 text-sm font-bold text-campus-ink">{item.condition}</span>
        </div>
        <div>
          <h1 className="text-3xl font-black leading-tight text-campus-ink">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-slate-700">
            <span className="font-bold">{item.seller}</span>
            <span className="text-slate-400">|</span>
            <span>已交易 {stats.totalDeals} 次</span>
            <span className="text-slate-400">|</span>
            <span>
              評價 {stats.avgRating !== null ? `${stats.avgRating} ★` : "暫無"} 
              {stats.totalReviews > 0 ? ` (${stats.totalReviews} 則)` : ""}
            </span>
          </div>
        </div>
        <ExchangeSummary exchangeMode={item.exchangeMode} exchangeLabel={item.exchangeLabel} salePrice={item.salePrice} />
        <dl className="grid gap-3 rounded-lg bg-campus-paper p-4 text-sm">
          <div>
            <dt className="font-black">交換條件</dt>
            <dd>{item.exchangeLabel}</dd>
          </div>
          <div>
            <dt className="font-black">面交地點</dt>
            <dd>{item.location}</dd>
          </div>
        </dl>
        <p className="leading-7 text-slate-700">{item.description}</p>
        <ItemActions itemId={item.id} itemStatus={item.status} />
      </section>
    </article>
  );
}
