"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";
import { clearAuthToken } from "@/lib/api";
import type { Buyer } from "@/lib/types";

const copy = {
  appName: "B2B\u5e93\u5b58\u5206\u914d",
  notSignedIn: "\u672a\u767b\u5f55",
  admin: "\u7ba1\u7406",
  logout: "\u767b\u51fa"
};

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
              <div className="truncate text-sm font-semibold">{copy.appName}</div>
              <div className="truncate text-xs text-neutral-500">{user?.username || copy.notSignedIn}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link href="/admin" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold">
                <ShieldCheck size={16} />
                {copy.admin}
              </Link>
            )}
            <Button type="button" variant="secondary" onClick={logout} aria-label={copy.logout}>
              <LogOut size={17} />
              {copy.logout}
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
