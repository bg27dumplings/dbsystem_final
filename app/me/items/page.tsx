import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { MyItemActions } from "@/components/items/my-item-actions";
import { StatusBadge } from "@/components/status-badge";
import { requireStudentSession } from "@/lib/auth/guards";
import { findStudentById } from "@/lib/auth/student-repository";
import { findItemsByStudentId, findActiveCategories } from "@/lib/marketplace/queries";
import { ProfileSettingsModal } from "@/components/profile-form";

export default async function MyItemsPage({
  searchParams
}: {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deactivated?: string;
    reactivated?: string;
    deleted?: string;
    keyword?: string;
    categoryId?: string;
    status?: string;
  }>;
}) {
  const session = await requireStudentSession("/me/items");
  const [items, categories, student] = await Promise.all([
    findItemsByStudentId(session.studentId),
    findActiveCategories(),
    findStudentById(session.studentId)
  ]);

  const params = await searchParams;
  const created = params?.created === "1";
  const updated = params?.updated === "1";
  const deactivated = params?.deactivated === "1";
  const reactivated = params?.reactivated === "1";
  const deleted = params?.deleted === "1";

  // Filter values
  const keyword = (params?.keyword ?? "").trim();
  const categoryId = params?.categoryId ?? "all";
  const statusFilter = params?.status ?? "all";

  // In-memory filtering
  let filteredItems = items;
  if (keyword) {
    filteredItems = filteredItems.filter(item =>
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(keyword.toLowerCase()))
    );
  }
  if (categoryId !== "all") {
    const matchedCat = categories.find(c => c.id === categoryId);
    if (matchedCat) {
      filteredItems = filteredItems.filter(item => item.category === matchedCat.name);
    }
  }
  if (statusFilter !== "all") {
    filteredItems = filteredItems.filter(item => item.status === statusFilter);
  }

  return (
    <section aria-labelledby="my-items-heading" className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div>
          <p className="text-sm font-black text-campus-moss">個人二手倉庫</p>
          <h1 id="my-items-heading" className="text-3xl font-black text-campus-ink">我的物品</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {student && (
            <ProfileSettingsModal
              studentNo={student.studentNo}
              initialName={student.name}
              initialEmail={student.email}
            />
          )}
          <Link href="/me/items/new" className="inline-flex min-h-12 items-center justify-center rounded-md bg-campus-gold px-4 py-3 font-black text-white">
            新增物品
          </Link>
        </div>
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

      <div className="space-y-4">
        <form method="GET" action="/me/items" className="flex flex-wrap gap-2 items-center rounded-lg bg-campus-paper p-3 shadow-sm ring-1 ring-campus-ink/5">
          <input
            name="keyword"
            defaultValue={keyword}
            placeholder="搜尋物品名稱..."
            className="flex-1 min-w-[150px] rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select name="categoryId" defaultValue={categoryId} className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
            <option value="all">所有分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={statusFilter} className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
            <option value="all">所有狀態</option>
            <option value="active">上架中</option>
            <option value="reserved">已預約</option>
            <option value="removed">已下架</option>
          </select>
          <button type="submit" className="rounded-md bg-campus-moss px-4 py-2 text-sm font-bold text-white hover:bg-campus-ink">
            篩選
          </button>
          {(keyword || categoryId !== "all" || statusFilter !== "all") && (
            <Link href="/me/items" className="text-sm font-bold text-slate-500 hover:text-campus-red px-2">
              清除
            </Link>
          )}
        </form>

        {filteredItems.length > 0 ? (
          <div className="grid gap-3">
            {filteredItems.map((item) => (
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
            title={items.length > 0 ? "沒有符合篩選條件的物品" : "你目前還沒有上架任何物品"}
            description={items.length > 0 ? "請嘗試調整您的篩選條件。" : "等你建立第一筆真實物品後，這裡才會顯示你的上架清單。"}
            actionLabel="新增物品"
            actionHref="/me/items/new"
          />
        )}
      </div>
    </section>
  );
}
