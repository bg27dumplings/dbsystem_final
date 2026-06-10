import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth/student-session";
import { findStudentWishlistItems } from "@/lib/marketplace/queries";
import { ItemCard } from "@/components/item-card";
import { EmptyState } from "@/components/empty-state";
import { Star } from "lucide-react";

export const metadata = {
  title: "購物清單 - Campus Share"
};

export default async function WishlistPage() {
  const session = await getStudentSession();
  if (!session) {
    redirect("/login");
  }

  const items = await findStudentWishlistItems(session.studentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-campus-ink flex items-center gap-2">
          <Star className="fill-campus-gold text-campus-gold h-6 w-6" />
          我的購物清單
        </h1>
        <p className="mt-2 text-sm text-slate-700">您收藏的物品都會顯示在這裡。若物品已下架或售出，將自動從清單中移除。</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} isWished={true} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-campus-ink/10 bg-white p-8">
          <EmptyState
            title="清單裡還沒有物品"
            description="看到喜歡或需要的物品，點擊星星就可以加入購物清單囉！"
            actionLabel="去逛逛"
            actionHref="/search"
          />
        </div>
      )}
    </div>
  );
}
