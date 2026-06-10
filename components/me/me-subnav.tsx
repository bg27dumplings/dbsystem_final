"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { User, Package, CalendarRange, MessageCircle, Star } from "lucide-react";

const links = [
  { href: "/me", label: "個人主頁", icon: User },
  { href: "/me/items", label: "物品管理", icon: Package },
  { href: "/me/appointments", label: "面交預約", icon: CalendarRange },
  { href: "/me/chat", label: "聊天訊息", icon: MessageCircle },
  { href: "/me/wishlist", label: "購物清單", icon: Star }
];

export function MeSubnav({ 
  unreadChatCount = 0, 
  unreadAppointmentCount = 0 
}: { 
  unreadChatCount?: number; 
  unreadAppointmentCount?: number; 
}) {
  const pathname = usePathname() || "";

  return (
    <nav aria-label="我的頁面導覽" className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full bg-white p-2 rounded-2xl shadow-sm ring-1 ring-campus-ink/10">
      {links.map((link) => {
        const isActive = link.href === "/me" ? pathname === "/me" : pathname.startsWith(link.href);
        const hasBadge = (link.href === "/me/appointments" && unreadAppointmentCount > 0) || 
                         (link.href === "/me/chat" && unreadChatCount > 0);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
              isActive
                ? "bg-campus-moss/10 text-campus-moss"
                : "text-slate-500 hover:bg-slate-50 hover:text-campus-ink"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative">
              <Icon size={20} className={isActive ? "text-campus-moss" : "text-slate-400"} />
              {hasBadge && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </div>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
