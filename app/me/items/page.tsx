import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { items } from "@/lib/data";
import { requireStudentSession } from "@/lib/auth/guards";

export default async function MyItemsPage() {
  await requireStudentSession("/me/items");

  return (
    <section aria-labelledby="my-items-heading" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-campus-moss">個人二手倉庫</p>
          <h1 id="my-items-heading" className="text-3xl font-black text-campus-ink">我的物品</h1>
        </div>
        <Link href="/me/items/new" className="inline-flex min-h-12 items-center justify-center rounded-md bg-campus-gold px-4 py-3 font-black text-white">新增物品</Link>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                <span className="text-sm font-bold text-slate-700">{item.category}</span>
              </div>
              <h2 className="mt-2 text-xl font-black text-campus-ink">{item.title}</h2>
              <p className="text-sm text-slate-700">{item.exchangeNote}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/me/items/${item.id}/edit`} className="rounded-md border border-campus-moss px-3 py-2 font-bold text-campus-moss">編輯</Link>
              <button className="rounded-md border border-slate-400 px-3 py-2 font-bold">下架</button>
              <button className="rounded-md border border-campus-red px-3 py-2 font-bold text-campus-red">刪除</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
