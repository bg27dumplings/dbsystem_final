import Link from "next/link";
import { Home, MessageCircle, PlusCircle, Search, UserRound } from "lucide-react";
import { StudentLogoutButton } from "@/components/auth/student-logout-button";
import { PendingReviewPrompt } from "@/components/reviews/pending-review-prompt";
import { getStudentSession } from "@/lib/auth/student-session";
import { findPendingReviews } from "@/lib/marketplace/queries";

const navItems = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/search", label: "搜尋", icon: Search },
  { href: "/me/items/new", label: "上架", icon: PlusCircle },
  { href: "/chat", label: "聊天", icon: MessageCircle },
  { href: "/me", label: "我的", icon: UserRound }
];

export async function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const session = await getStudentSession();
  const pendingReviews = session ? await findPendingReviews(session.studentId) : [];

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">
        跳到主要內容
      </a>
      <header className="sticky top-0 z-30 border-b border-campus-ink/10 bg-campus-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <Link href="/" className="rounded-md text-xl font-black tracking-tight text-campus-ink">
            智慧校園共享
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <nav aria-label="主要導覽" className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-campus-ink hover:bg-white">
                    <Icon aria-hidden="true" size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-campus-ink">{session.name}</span>
                <StudentLogoutButton />
              </div>
            ) : (
              <Link href="/auth/login" className="inline-flex min-h-11 items-center justify-center rounded-full border border-campus-moss px-4 py-2 text-sm font-black text-campus-moss hover:bg-white">
                會員登入
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-7xl px-4 pb-24 pt-5 md:px-6 lg:pb-10">
        {session ? <PendingReviewPrompt reviews={pendingReviews} /> : null}
        {children}
      </main>
      <nav aria-label="手機主要導覽" className="fixed inset-x-0 bottom-0 z-40 border-t border-campus-ink/10 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(16,35,31,0.12)] backdrop-blur md:hidden safe-bottom">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex min-h-12 flex-col items-center justify-center rounded-md text-xs font-bold text-campus-ink hover:bg-campus-paper">
                <Icon aria-hidden="true" size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
