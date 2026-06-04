import { FilterPanel } from "@/components/filter-panel";
import { ItemCard } from "@/components/item-card";
import { items } from "@/lib/data";

export default function SearchPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside>
        <FilterPanel />
      </aside>
      <section aria-labelledby="search-heading" className="space-y-4">
        <div>
          <p className="text-sm font-black text-campus-moss">搜尋與篩選</p>
          <h1 id="search-heading" className="text-3xl font-black text-campus-ink">
            找到剛好需要的二手物資
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
