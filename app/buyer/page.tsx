"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Panel, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, remainingText } from "@/lib/format";
import { normalizeImageUrl, shouldSkipImageOptimization } from "@/lib/image-url";
import type { Auction } from "@/lib/types";
import { useSessionUser } from "@/lib/use-session-user";

const t = {
  loading: "\u52a0\u8f7d\u4e2d...",
  title: "\u5f53\u524d\u53ef\u53c2\u4e0e\u573a\u6b21",
  subtitle: "\u6bcf\u4e2a\u573a\u6b21\u53ea\u80fd\u4fdd\u7559\u4e00\u6761\u6709\u6548\u51fa\u4ef7\uff0c\u53ef\u5728\u7ed3\u675f\u524d\u4fee\u6539\u3002",
  refresh: "\u5237\u65b0",
  inventory: "\u5e93\u5b58",
  highestPremium: "\u6700\u9ad8\u670d\u52a1\u8d39",
  myBid: "\u6211\u7684\u51fa\u4ef7",
  notSubmitted: "\u5c1a\u672a\u63d0\u4ea4",
  pieces: "\u4ef6",
  endTime: "\u7ed3\u675f\u65f6\u95f4",
  enter: "\u8fdb\u5165\u573a\u6b21",
  empty: "\u6682\u65e0\u5f00\u653e\u573a\u6b21\u3002"
};

export default function BuyerHome() {
  const { user, loading, error } = useSessionUser();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [busy, setBusy] = useState(false);

  const loadAuctions = useCallback(async () => {
    setBusy(true);
    try {
      setAuctions(await api<Auction[]>("/auctions"));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadAuctions();
  }, [user, loadAuctions]);

  if (loading) return <main className="p-6 text-sm text-neutral-500">{t.loading}</main>;

  return (
    <AppShell user={user}>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{t.title}</h1>
            <p className="mt-1 text-sm text-neutral-500">{t.subtitle}</p>
          </div>
          <Button variant="secondary" onClick={loadAuctions} disabled={busy}>
            <RefreshCw size={16} />
            {t.refresh}
          </Button>
        </div>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {auctions.map((auction) => {
            const imageUrl = normalizeImageUrl(auction.product_image);

            return (
              <Panel key={auction.id} className="overflow-hidden rounded-lg border">
                {imageUrl && (
                  <div className="flex h-72 items-center justify-center bg-white">
                    <Image
                      src={imageUrl}
                      alt={auction.product_name}
                      width={720}
                      height={320}
                      unoptimized={shouldSkipImageOptimization(imageUrl)}
                      className="size-full object-contain"
                    />
                  </div>
                )}
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase text-moss">{auction.sku}</div>
                    <h2 className="mt-1 truncate text-lg font-semibold">{auction.product_name}</h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-md bg-field px-2 py-1 text-sm">
                    <Clock size={14} />
                    {remainingText(auction.end_time)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label={t.inventory} value={auction.inventory} />
                  <Stat label={t.highestPremium} value={`${auction.highest_premium}%`} />
                </div>
                <div className="rounded-md border border-line bg-field p-3 text-sm">
                  <div className="font-medium">{t.myBid}</div>
                  <div className="mt-1 text-neutral-600">
                    {auction.my_bid ? `${auction.my_bid.premium}% / ${auction.my_bid.quantity} ${t.pieces}` : t.notSubmitted}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">{t.endTime} {formatDateTime(auction.end_time)}</div>
                </div>
                <Link href={`/buyer/auctions/${auction.id}`} className="focus-ring inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white">
                  {t.enter}
                  <ArrowRight size={16} />
                </Link>
              </div>
              </Panel>
            );
          })}
        </div>
        {!auctions.length && !busy && <div className="rounded-lg border border-line bg-white p-8 text-center text-sm text-neutral-500">{t.empty}</div>}
      </main>
    </AppShell>
  );
}
