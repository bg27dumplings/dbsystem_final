"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

type WishlistButtonProps = {
  itemId: string;
  initialIsWished: boolean;
  className?: string;
  iconSize?: number;
};

export function WishlistButton({ itemId, initialIsWished, className = "", iconSize = 20 }: WishlistButtonProps) {
  const [isWished, setIsWished] = useState(initialIsWished);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault(); // Prevent Link navigation if inside an ItemCard
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/items/${itemId}/wishlist`, { method: "POST" });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
        }
        return;
      }
      
      const data = await res.json();
      if (data.ok) {
        setIsWished(data.isWished);
        router.refresh(); // Refresh page to update any parent state if needed
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`group relative flex items-center justify-center rounded-full bg-white/80 p-2 text-slate-500 backdrop-blur-sm transition-all hover:bg-white hover:text-campus-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-campus-moss disabled:opacity-50 ${className}`}
      aria-label={isWished ? "移除購物清單" : "加入購物清單"}
      aria-pressed={isWished}
    >
      <Star
        size={iconSize}
        className={`transition-all duration-300 ${
          isWished ? "fill-campus-gold text-campus-gold scale-110" : "group-hover:scale-110"
        }`}
      />
    </button>
  );
}
