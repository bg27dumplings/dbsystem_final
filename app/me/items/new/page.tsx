import { requireStudentSession } from "@/lib/auth/guards";

export default async function NewItemPage() {
  await requireStudentSession("/me/items/new");

  return (
    <section className="mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-sm ring-1 ring-campus-ink/10" aria-labelledby="new-item-heading">
      <p className="text-sm font-black text-campus-moss">物品上架</p>
      <h1 id="new-item-heading" className="text-3xl font-black text-campus-ink">新增二手物品</h1>
      <form className="mt-6 grid gap-5">
        <fieldset className="rounded-lg bg-campus-paper p-4">
          <legend className="px-1 font-black">照片，最多五張</legend>
          <label htmlFor="photos" className="mt-2 block rounded-md border-2 border-dashed border-campus-moss bg-white p-6 text-center font-bold text-campus-moss">
            點擊或拖曳照片到這裡
          </label>
          <input id="photos" type="file" accept="image/*" multiple className="sr-only" aria-describedby="photos-help" />
          <p id="photos-help" className="mt-2 text-sm text-slate-700">目前這個頁面只保留真實表單版型，尚未接到資料庫上架流程。</p>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="font-bold">物品名稱</label>
            <input id="title" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
          </div>
          <div>
            <label htmlFor="category" className="font-bold">分類</label>
            <select id="category" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3">
              <option>書籍 / 文具</option>
              <option>電子 3C</option>
              <option>日用品</option>
            </select>
          </div>
          <div>
            <label htmlFor="condition" className="font-bold">新舊程度</label>
            <select id="condition" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3">
              <option>全新</option>
              <option>九成新</option>
              <option>八成新</option>
              <option>明顯使用</option>
            </select>
          </div>
          <div>
            <label htmlFor="price" className="font-bold">原始價格</label>
            <input id="price" type="number" min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
          </div>
          <div>
            <label htmlFor="sale-price" className="font-bold">出售價格</label>
            <input id="sale-price" type="number" min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="exchange" className="font-bold">交換條件</label>
            <input id="exchange" placeholder="例如：一杯大冰美、50 元、free" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="font-bold">詳細描述</label>
            <textarea id="description" rows={5} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3" />
          </div>
        </div>
        <button type="button" className="rounded-md bg-slate-400 px-4 py-3 font-black text-white" disabled>發布上架（尚未開放）</button>
      </form>
    </section>
  );
}
