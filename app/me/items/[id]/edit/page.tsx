import Link from "next/link";
import { ItemForm } from "@/components/items/item-form";
import { requireStudentSession } from "@/lib/auth/guards";
import { findActiveCategories, findOwnedItemById } from "@/lib/marketplace/queries";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStudentSession("/me/items");
  const { id } = await params;
  const [item, categories] = await Promise.all([
    findOwnedItemById(session.studentId, id),
    findActiveCategories()
  ]);

  if (!item) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">找不到這筆物品</h1>
        <p className="mt-3 text-slate-700">這筆物品不存在，或不屬於目前登入的帳號。</p>
        <Link href="/me/items" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          回到我的物品
        </Link>
      </section>
    );
  }

  const exchangeMode =
    item.exchangeMode === "custom" ? "price" : (item.exchangeMode as "price" | "treat_drink" | "treat_food" | "free");

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/me/items" className="text-sm font-bold text-slate-500 hover:text-campus-moss">
          &larr; 返回
        </Link>
        <h1 className="text-xl font-black text-campus-ink">編輯物品</h1>
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10">
        <ItemForm
          categories={categories}
          mode="edit"
          initialValues={{
            itemId: item.id,
            title: item.title,
            categoryId: item.categoryId ?? categories[0]?.id ?? "",
            conditionLabel: item.condition,
            location: item.location,
            quantity: String(item.quantity),
            mapPoint: item.mapPoint,
            exchangeMode,
            exchangeValue: item.exchangeValue ?? (item.salePrice !== undefined ? String(item.salePrice) : ""),
            description: item.description,
            images: item.images
          }}
        />
      </div>
    </section>
  );
}
