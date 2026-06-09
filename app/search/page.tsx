import { EmptyState } from "@/components/empty-state";
import { FilterPanel } from "@/components/filter-panel";
import { ItemCard } from "@/components/item-card";
import { findActiveCategories, findPublicItems } from "@/lib/marketplace/queries";

export default async function SearchPage({
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
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside>
        <FilterPanel categories={categories} values={filters} />
      </aside>
      <section aria-labelledby="search-heading" className="space-y-4">
        <div>
          <p className="text-sm font-black text-campus-moss">搜尋與篩選</p>
          <h1 id="search-heading" className="text-3xl font-black text-campus-ink">
            找到剛好需要的二手物資
          </h1>
          <p className="mt-2 text-sm text-slate-700">目前顯示 {items.length} 筆符合條件的物品。</p>
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="目前沒有符合條件的物品"
            description="試著調整關鍵字、分類或價格範圍後再搜尋一次。"
            actionLabel="清除篩選"
            actionHref="/search"
          />
        )}
      </section>
    </div>
  );
}
