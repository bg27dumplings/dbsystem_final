import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ImageViewer } from "@/components/image-viewer";
import { StatusBadge } from "@/components/status-badge";
import { AiBlockedActions } from "@/components/items/ai-blocked-actions";
import { StatusToggleActions } from "@/components/items/status-toggle-actions";
import { requireStudentSession } from "@/lib/auth/guards";
import { findItemsByStudentId } from "@/lib/marketplace/queries";

export default async function MyItemsPage({
  searchParams
}: {
  searchParams?: Promise<{ created?: string; updated?: string }>;
}) {
  const session = await requireStudentSession("/me/items");
  const items = await findItemsByStudentId(session.studentId);
  const params = await searchParams;
  const created = params?.created === "1";
  const updated = params?.updated === "1";

  return (
    <section aria-labelledby="my-items-heading" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="my-items-heading" className="text-xl font-black text-campus-ink">我的物品</h2>
          <p className="mt-1 text-sm text-slate-700">管理您上架的物品，隨時更新狀態或新增項目。</p>
        </div>
        <Link href="/items/new" className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center rounded-md bg-campus-gold px-4 py-3 font-black text-white">新增物品</Link>
      </div>
      {created ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
          新物品已成功上架。
        </div>
      ) : null}
      {updated ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
          物品內容已更新。
        </div>
      ) : null}
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="grid gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-campus-ink/10 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              {item.images && item.images.length > 0 && (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-slate-200">
                  <ImageViewer
                    src={item.images[0]}
                    alt={item.title}
                  />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="text-sm font-bold text-slate-700">{item.category}</span>
                </div>
                <h2 className="mt-2 text-xl font-black text-campus-ink">{item.title}</h2>
                <p className="text-sm text-slate-700">{item.exchangeLabel}</p>
                <p className="text-sm text-slate-700">數量：{item.quantity}</p>
                {item.status === "ai_blocked" && (
                  <div className="mt-3 rounded-md bg-rose-50 p-3 border border-red-100">
                    <p className="text-sm font-bold text-campus-red mb-1">系統 AI 阻擋上架</p>
                    <p className="text-sm text-slate-700">原因：{item.removedReason || "違反社群規範或包含敏感內容。"}</p>
                    <AiBlockedActions itemId={item.id} />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <StatusToggleActions itemId={item.id} currentStatus={item.status} />
                {(item.status === "active" || item.status === "removed") && (
                  <Link href={`/me/items/${item.id}/edit`} className="rounded-md border border-campus-moss px-3 py-2 text-sm font-bold text-campus-moss hover:bg-green-50">
                    編輯內容
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="目前沒有任何物品"
          description="開始整理不需要的物資，發布第一件物品吧！"
          actionLabel="新增物品"
          actionHref="/items/new"
        />
      )}
    </section>
  );
}
