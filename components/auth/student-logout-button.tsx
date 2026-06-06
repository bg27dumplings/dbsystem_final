"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudentLogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  return (
    <button
      type="button"
      disabled={isPending}
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-campus-ink/15 px-4 py-2 text-sm font-black text-campus-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      onClick={async () => {
        setIsPending(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/auth/login");
          router.refresh();
        } finally {
          setIsPending(false);
        }
      }}
    >
      {isPending ? "登出中..." : "登出"}
    </button>
  );
}
