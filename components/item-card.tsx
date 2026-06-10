import Link from "next/link";
import type { MarketplaceItem } from "@/lib/marketplace/types";
import { ExchangeSummary } from "@/components/exchange-summary";
import { StatusBadge } from "@/components/status-badge";
import { WishlistButton } from "@/components/items/wishlist-button";

export function ItemCard({ item, isWished = false }: { item: MarketplaceItem; isWished?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-campus-ink/10 transition hover:-translate-y-1 hover:shadow-lift focus-within:shadow-lift">
      <Link href={`/items/${item.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-campus-paper">
          {item.images[0] ? (
            <img
              src={item.images[0]}
              alt={`${item.title} 的物品照片`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-bold text-campus-ink/70">
              目前尚未上傳物品圖片
            </div>
          )}
          <div className="absolute left-2 top-2">
            <StatusBadge status={item.status} />
          </div>
          <div className="absolute right-2 top-2 z-10">
            <WishlistButton itemId={item.id} initialIsWished={isWished} />
          </div>
        </div>
        <div className="space-y-2 p-3">
          <div>
            <p className="text-xs font-bold text-campus-moss">{item.category}</p>
            <h2 className="line-clamp-2 text-base font-black leading-tight text-campus-ink">{item.title}</h2>
          </div>
          <ExchangeSummary exchangeMode={item.exchangeMode} exchangeLabel={item.exchangeLabel} salePrice={item.salePrice} originalPrice={item.originalPrice} />
          <p className="text-sm text-slate-700">{item.location}</p>
        </div>
      </Link>
    </article>
  );
}
