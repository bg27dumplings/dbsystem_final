import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FilterPanel } from "@/components/filter-panel";
import { ItemCard } from "@/components/item-card";
import { findActiveCategories, findPublicItems } from "@/lib/marketplace/queries";

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{
    keyword?: string;
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = {
    keyword: params?.keyword,
    categoryId: params?.categoryId,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice
  };
  const [categories, items] = await Promise.all([findActiveCategories(), findPublicItems(filters)]);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="hidden lg:block">
        <FilterPanel categories={categories} action="/" values={filters} />
      </aside>
      <section aria-labelledby="home-heading" className="space-y-5">
        <div className="rounded-lg border border-campus-ink/10 bg-white p-5 shadow-sm md:p-7">
          <p className="text-sm font-black text-campus-moss">照片優先 / 校園面交 / 學生共享</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 id="home-heading" className="text-3xl font-black leading-tight text-campus-ink md:text-5xl">
                今天校園裡有哪些東西可以接手？
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
                瀏覽同學上架的課本、3C 與宿舍用品。訪客可以先看，想私聊或預約面交時再登入。
              </p>
            </div>
            <Link href="/me/items/new" className="inline-flex min-h-12 items-center justify-center rounded-md bg-campus-gold px-5 py-3 font-black text-white hover:bg-campus-ink">
              立即上架
            </Link>
          </div>
        </div>
        <div className="lg:hidden">
          <FilterPanel categories={categories} action="/" values={filters} compact />
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="目前還沒有上架物品"
            description="現在資料庫裡還沒有任何公開物品。等第一位同學完成上架後，這裡才會顯示真實內容。"
            actionLabel="前往上架頁"
            actionHref="/me/items/new"
          />
        )}
      </section>
    </div>
  );
}
