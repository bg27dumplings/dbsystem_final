import { ALL_MARKETPLACE_CATEGORIES_LABEL } from "@/lib/marketplace/catalog";
import type { MarketplaceCategory, MarketplaceItemFilters } from "@/lib/marketplace/domain/models";

export function FilterPanel({
  categories,
  action = "/search",
  values = {},
  compact = false
}: {
  categories: MarketplaceCategory[];
  action?: string;
  values?: {
    keyword?: string;
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
  };
  compact?: boolean;
}) {
  return (
    <form
      method="GET"
      action={action}
      className={`rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10 ${compact ? "" : "lg:sticky lg:top-24"}`}
      aria-label="物品篩選"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="keyword" className="text-sm font-bold text-campus-ink">
            關鍵字
          </label>
          <input
            id="keyword"
            name="keyword"
            defaultValue={values.keyword ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
            placeholder="搜尋課本、3C、宿舍用品"
          />
        </div>
        <fieldset>
          <legend className="text-sm font-bold text-campus-ink">分類</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="categoryId"
                value=""
                defaultChecked={!values.categoryId}
                className="sr-only peer"
              />
              <span className="inline-block rounded-full border border-campus-moss/30 bg-campus-paper px-3 py-1.5 text-sm font-bold text-campus-ink hover:bg-white peer-checked:border-campus-moss peer-checked:bg-campus-moss peer-checked:text-white">
                {ALL_MARKETPLACE_CATEGORIES_LABEL}
              </span>
            </label>
            {categories.map((category) => (
              <label key={category.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="categoryId"
                  value={category.id}
                  defaultChecked={values.categoryId === category.id}
                  className="sr-only peer"
                />
                <span className="inline-block rounded-full border border-campus-moss/30 bg-campus-paper px-3 py-1.5 text-sm font-bold text-campus-ink hover:bg-white peer-checked:border-campus-moss peer-checked:bg-campus-moss peer-checked:text-white">
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="min-price" className="text-sm font-bold">
              最低價
            </label>
            <input
              id="min-price"
              name="minPrice"
              type="number"
              min="0"
              defaultValue={values.minPrice ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="text-sm font-bold">
              最高價
            </label>
            <input
              id="max-price"
              name="maxPrice"
              type="number"
              min="0"
              defaultValue={values.maxPrice ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <button type="submit" className="w-full rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          套用篩選
        </button>
      </div>
    </form>
  );
}
