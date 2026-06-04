import Link from "next/link";
import { FilterPanel } from "@/components/filter-panel";
import { ItemCard } from "@/components/item-card";
import { items } from "@/lib/data";

export default function HomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="hidden lg:block">
        <FilterPanel />
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
          <FilterPanel compact />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
