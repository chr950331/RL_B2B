"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";
import { clearAuthToken } from "@/lib/api";
import type { Buyer } from "@/lib/types";

export function AppShell({ user, children }: { user: Buyer | null; children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    clearAuthToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-field">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/buyer" className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-ink text-white">
              <ShoppingBag size={19} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">RL B2B 库存分配</div>
              <div className="truncate text-xs text-neutral-500">{user?.username || "未登录"}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link href="/admin" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold">
                <ShieldCheck size={16} />
                管理
              </Link>
            )}
            <Button type="button" variant="ghost" onClick={logout} aria-label="退出登录">
              <LogOut size={17} />
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
