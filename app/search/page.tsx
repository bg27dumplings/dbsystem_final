import { EmptyState } from "@/components/empty-state";
import { FilterPanel } from "@/components/filter-panel";
import { ItemCard } from "@/components/item-card";
import { findPublicItems } from "@/lib/marketplace/queries";

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{
    keyword?: string;
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const params = await searchParams;
  const items = await findPublicItems({
    keyword: params.keyword,
    categoryId: params.categoryId,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside>
        <FilterPanel searchParams={params} />
      </aside>
      <section aria-labelledby="search-heading" className="space-y-4">
        <div>
          <p className="text-sm font-black text-campus-moss">搜尋與篩選</p>
          <h1 id="search-heading" className="text-3xl font-black text-campus-ink">
            找到剛好需要的二手物資
          </h1>
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="目前沒有可搜尋的物品"
            description="公開物品列表目前是空的，所以搜尋結果不會顯示任何資料。"
            actionLabel="回首頁"
            actionHref="/"
          />
        )}
      </section>
    </div>
  );
}
