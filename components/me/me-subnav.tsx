"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/me", label: "個人主頁" },
  { href: "/me/items", label: "我的物品" },
  { href: "/me/appointments", label: "我的預約" },
  { href: "/me/chat", label: "聊天室" }
];

export function MeSubnav() {
  const pathname = usePathname() || "";

  return (
    <nav aria-label="我的頁面導覽" className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = link.href === "/me" ? pathname === "/me" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              isActive
                ? "bg-campus-ink text-white"
                : "text-campus-ink hover:bg-campus-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-campus-ink focus-visible:ring-offset-2"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
