import Link from "next/link";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { ExchangeSummary } from "@/components/exchange-summary";
import { requireStudentSession } from "@/lib/auth/guards";
import { findMarketplaceItemActionContext } from "@/lib/marketplace/infrastructure/item-repository";
import { findItemById } from "@/lib/marketplace/queries";

function toSupportedExchangeMode(exchangeMode: string) {
  if (exchangeMode === "price" || exchangeMode === "treat_drink" || exchangeMode === "treat_food" || exchangeMode === "free" || exchangeMode === "custom") {
    return exchangeMode;
  }

  return "free";
}

export default async function NewAppointmentPage({
  searchParams
}: {
  searchParams: Promise<{ itemId?: string }>;
}) {
  const { itemId = "" } = await searchParams;
  const session = await requireStudentSession(`/appointments/new?itemId=${encodeURIComponent(itemId)}`);

  const item = itemId ? await findItemById(itemId) : null;
  const actionContext = itemId ? await findMarketplaceItemActionContext(itemId) : null;

  if (!item || !actionContext) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">找不到這筆物品</h1>
        <p className="mt-3 text-slate-700">請從物品詳情頁重新進入面交流程。</p>
        <Link href="/search" className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          回到物品列表
        </Link>
      </section>
    );
  }

  if (actionContext.sellerId === session.studentId) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">不能預約自己的物品</h1>
        <p className="mt-3 text-slate-700">請回到物品詳情頁，改用編輯或管理自己的上架內容。</p>
        <Link href={`/items/${item.id}`} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          回到物品詳情
        </Link>
      </section>
    );
  }

  if (actionContext.status !== "active") {
    return (
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-campus-ink/10">
        <h1 className="text-2xl font-black text-campus-ink">這筆物品目前無法建立新面交</h1>
        <p className="mt-3 text-slate-700">請回到物品詳情頁確認目前的預約狀態。</p>
        <Link href={`/items/${item.id}`} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-campus-moss px-4 py-3 font-black text-white hover:bg-campus-ink">
          回到物品詳情
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="new-appointment-heading">
      <p className="text-sm font-black text-campus-moss">面交預約</p>
      <h1 id="new-appointment-heading" className="text-3xl font-black text-campus-ink">建立面交預約</h1>
      <div className="mt-5 rounded-lg bg-campus-paper p-4">
        <p className="text-sm font-black text-campus-moss">預約物品</p>
        <h2 className="mt-1 text-2xl font-black text-campus-ink">{item.title}</h2>
        <p className="mt-1 text-sm text-slate-700">{item.seller}</p>
        <div className="mt-3">
          <ExchangeSummary exchangeMode={item.exchangeMode} exchangeLabel={item.exchangeLabel} salePrice={item.salePrice} />
        </div>
      </div>
      <AppointmentForm
        itemId={item.id}
        initialLocation={item.location}
        initialExchangeMode={toSupportedExchangeMode(item.exchangeMode)}
        initialExchangeValue={item.exchangeMode === "price" ? String(item.salePrice ?? "") : item.exchangeValue ?? ""}
      />
    </section>
  );
}
