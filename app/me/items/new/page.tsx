import { requireStudentSession } from "@/lib/auth/guards";
import { findActiveCategories } from "@/lib/marketplace/queries";
import { ItemForm } from "@/components/items/item-form";

export default async function NewItemPage() {
  await requireStudentSession("/me/items/new");
  const categories = await findActiveCategories();

  if (categories.length === 0) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="new-item-heading">
        <p className="text-sm font-black text-campus-moss">物品上架</p>
        <h1 id="new-item-heading" className="text-3xl font-black text-campus-ink">新增二手物品</h1>
        <p className="mt-4 rounded-2xl border border-campus-red/20 bg-rose-50 px-4 py-3 text-sm font-semibold text-campus-red">
          目前沒有可用分類，請先建立 active 狀態的 categories 資料。
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="new-item-heading">
      <p className="text-sm font-black text-campus-moss">物品上架</p>
      <h1 id="new-item-heading" className="text-3xl font-black text-campus-ink">新增二手物品</h1>
      <ItemForm categories={categories} />
    </section>
  );
}
