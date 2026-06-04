import { categories } from "@/lib/data";

export function FilterPanel({ compact = false }: { compact?: boolean }) {
  return (
    <form className={`rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10 ${compact ? "" : "lg:sticky lg:top-24"}`} aria-label="物品篩選">
      <div className="space-y-4">
        <div>
          <label htmlFor="keyword" className="text-sm font-bold text-campus-ink">
            關鍵字
          </label>
          <input id="keyword" name="keyword" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" placeholder="搜尋課本、3C、宿舍用品" />
        </div>
        <fieldset>
          <legend className="text-sm font-bold text-campus-ink">分類</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button key={category} type="button" className="rounded-full border border-campus-moss/30 bg-campus-paper px-3 py-1.5 text-sm font-bold text-campus-ink hover:bg-white">
                {category}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="min-price" className="text-sm font-bold">
              最低價
            </label>
            <input id="min-price" type="number" min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="max-price" className="text-sm font-bold">
              最高價
            </label>
            <input id="max-price" type="number" min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <button type="submit" className="w-full rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          套用篩選
        </button>
      </div>
    </form>
  );
}
