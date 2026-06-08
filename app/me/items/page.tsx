import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { MyItemActions } from "@/components/items/my-item-actions";
import { StatusBadge } from "@/components/status-badge";
import { requireStudentSession } from "@/lib/auth/guards";
import { findItemsByStudentId } from "@/lib/marketplace/queries";

export default async function MyItemsPage({
  searchParams
}: {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deactivated?: string;
    reactivated?: string;
    deleted?: string;
  }>;
}) {
  const session = await requireStudentSession("/me/items");
  const items = await findItemsByStudentId(session.studentId);
  const params = await searchParams;
  const created = params?.created === "1";
  const updated = params?.updated === "1";
  const deactivated = params?.deactivated === "1";
  const reactivated = params?.reactivated === "1";
  const deleted = params?.deleted === "1";

  return (
    <section aria-labelledby="my-items-heading" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-campus-moss">個人二手倉庫</p>
          <h1 id="my-items-heading" className="text-3xl font-black text-campus-ink">我的物品</h1>
        </div>
        <Link href="/me/items/new" className="inline-flex min-h-12 items-center justify-center rounded-md bg-campus-gold px-4 py-3 font-black text-white">新增物品</Link>
      </div>
      {created ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
          新物品已成功上架。
        </div>
      ) : null}
      {updated ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
          物品內容已成功更新。
        </div>
      ) : null}
      {deactivated ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">
          物品已下架。
        </div>
      ) : null}
      {reactivated ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
          物品已重新上架。
        </div>
      ) : null}
      {deleted ? (
        <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800" role="status">
          物品已刪除。
        </div>
      ) : null}
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-sm font-bold text-slate-700">{item.category}</span>
                </div>
                <h2 className="mt-2 text-xl font-black text-campus-ink">{item.title}</h2>
                <p className="text-sm text-slate-700">{item.exchangeLabel}</p>
              </div>
              <MyItemActions itemId={item.id} itemStatus={item.status} />
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="你目前還沒有上架任何物品"
          description="等你建立第一筆真實物品後，這裡才會顯示你的上架清單。"
          actionLabel="新增物品"
          actionHref="/me/items/new"
        />
      )}
    </section>
  );
}
