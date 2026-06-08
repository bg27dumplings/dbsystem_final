import Link from "next/link";
import { requireStudentSession } from "@/lib/auth/guards";
import { findOwnedItemById } from "@/lib/marketplace/queries";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStudentSession("/me/items");
  const { id } = await params;
  const item = await findOwnedItemById(session.studentId, id);
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

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
      <p className="text-sm font-black text-campus-moss">物品編輯</p>
      <h1 className="mt-2 text-2xl font-black text-campus-ink">編輯功能尚未開放</h1>
      <p className="mt-3 text-slate-700">
        目前這筆物品仍可正常展示，你可以先回到我的物品頁查看。
      </p>
      <div className="mt-4 rounded-lg bg-campus-paper p-4">
        <p className="font-bold text-campus-ink">{item.title}</p>
        <p className="mt-1 text-sm text-slate-700">{item.exchangeLabel}</p>
      </div>
      <Link href="/me/items" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
        回到我的物品
      </Link>
    </section>
  );
}
