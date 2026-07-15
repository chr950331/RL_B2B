"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Panel, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime, remainingText } from "@/lib/format";
import type { Auction } from "@/lib/types";
import { useSessionUser } from "@/lib/use-session-user";

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

  if (loading) return <main className="p-6 text-sm text-neutral-500">加载中...</main>;

  return (
    <AppShell user={user}>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">当前可参与场次</h1>
            <p className="mt-1 text-sm text-neutral-500">每个场次只能保留一条有效出价，可在结束前修改。</p>
          </div>
          <Button variant="secondary" onClick={loadAuctions} disabled={busy}>
            <RefreshCw size={16} />
            刷新
          </Button>
        </div>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {auctions.map((auction) => (
            <Panel key={auction.id} className="overflow-hidden rounded-lg border">
              {auction.product_image && (
                <div className="h-44 bg-neutral-100">
                  <Image src={auction.product_image} alt={auction.product_name} width={720} height={320} className="size-full object-cover" />
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
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="库存" value={auction.inventory} />
                  <Stat label="最高服务费" value={`${auction.highest_premium}%`} />
                  <Stat label="总需求" value={auction.total_demand} />
                </div>
                <div className="rounded-md border border-line bg-field p-3 text-sm">
                  <div className="font-medium">我的出价</div>
                  <div className="mt-1 text-neutral-600">
                    {auction.my_bid ? `${auction.my_bid.premium}% / ${auction.my_bid.quantity} 件` : "尚未提交"}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">结束时间 {formatDateTime(auction.end_time)}</div>
                </div>
                <Link href={`/buyer/auctions/${auction.id}`} className="focus-ring inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white">
                  进入场次
                  <ArrowRight size={16} />
                </Link>
              </div>
            </Panel>
          ))}
        </div>
        {!auctions.length && !busy && <div className="rounded-lg border border-line bg-white p-8 text-center text-sm text-neutral-500">暂无开放场次。</div>}
      </main>
    </AppShell>
  );
}
