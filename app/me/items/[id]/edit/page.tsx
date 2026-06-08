import Link from "next/link";
import { ItemForm } from "@/components/items/item-form";
import { requireStudentSession } from "@/lib/auth/guards";
import { findActiveCategories, findEditableOwnedItemById } from "@/lib/marketplace/queries";

function BlockedState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
      <p className="text-sm font-black text-campus-moss">物品編輯</p>
      <h1 className="mt-2 text-2xl font-black text-campus-ink">{title}</h1>
      <p className="mt-3 text-slate-700">{description}</p>
      <Link href="/me/items" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
        回到我的物品
      </Link>
    </section>
  );
}

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireStudentSession(`/me/items/${id}/edit`);
  const [item, categories] = await Promise.all([
    findEditableOwnedItemById(session.studentId, id),
    findActiveCategories()
  ]);

  if (!item) {
    return (
      <BlockedState
        title="找不到這筆物品"
        description="這筆物品不存在，或不屬於目前登入的帳號。"
      />
    );
  }

  if (item.status === "reserved") {
    return (
      <BlockedState
        title="這筆物品目前預約中"
        description="預約中的物品不可由前台修改，避免面交流程中的內容漂移。"
      />
    );
  }

  if (item.status === "violation_removed") {
    return (
      <BlockedState
        title="這筆物品已被限制操作"
        description="違規下架的物品不可由前台編輯。若需要協助，請聯繫管理方。"
      />
    );
  }

  if (item.status === "deleted") {
    return (
      <BlockedState
        title="這筆物品已刪除"
        description="已刪除的物品不可由前台復原或編輯。"
      />
    );
  }

  if (categories.length === 0) {
    return (
      <BlockedState
        title="目前沒有可用分類"
        description="請先建立 active 狀態的 categories 資料後，再編輯物品。"
      />
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="edit-item-heading">
      <p className="text-sm font-black text-campus-moss">物品編輯</p>
      <h1 id="edit-item-heading" className="text-3xl font-black text-campus-ink">編輯二手物品</h1>
      <ItemForm categories={categories} mode="edit" item={item} />
    </section>
  );
}
