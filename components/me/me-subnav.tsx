import Link from "next/link";

const links = [
  { href: "/me", label: "總覽" },
  { href: "/me/items", label: "我的物品" },
  { href: "/me/appointments", label: "我的預約" },
  { href: "/me/profile", label: "個人資料" }
];

export function MeSubnav({ active }: { active: "overview" | "items" | "appointments" | "profile" }) {
  const activeHref = {
    overview: "/me",
    items: "/me/items",
    appointments: "/me/appointments",
    profile: "/me/profile"
  }[active];

  return (
    <nav aria-label="我的頁面導覽" className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = link.href === activeHref;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "rounded-full bg-campus-moss px-4 py-2 text-sm font-black text-white"
                : "rounded-full border border-campus-moss px-4 py-2 text-sm font-black text-campus-moss hover:bg-campus-paper"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
