"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Save, Timer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Input, Label, Panel, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { formatTime, remainingText } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Auction, LeaderboardRow } from "@/lib/types";
import { useSessionUser } from "@/lib/use-session-user";

const t = {
  saved: "\u5df2\u4fdd\u5b58",
  saveFailed: "\u4fdd\u5b58\u5931\u8d25",
  loading: "\u52a0\u8f7d\u4e2d...",
  inventory: "\u5e93\u5b58",
  highestPremium: "\u6700\u9ad8\u670d\u52a1\u8d39",
  remainingTime: "\u5269\u4f59\u65f6\u95f4",
  backHome: "\u8fd4\u56de\u4e3b\u754c\u9762",
  leaderboard: "\u51fa\u4ef7\u6392\u884c\u699c",
  username: "\u7528\u6237\u540d",
  premium: "\u670d\u52a1\u8d39",
  quantity: "\u6570\u91cf",
  updatedAt: "\u66f4\u65b0\u65f6\u95f4",
  me: "\u6211",
  formTitle: "\u63d0\u4ea4\u6216\u4fee\u6539\u6211\u7684\u51fa\u4ef7",
  premiumLabel: "\u670d\u52a1\u8d39\u6bd4\u4f8b (%)",
  quantityLabel: "\u9700\u6c42\u6570\u91cf",
  saving: "\u4fdd\u5b58\u4e2d...",
  saveBid: "\u4fdd\u5b58\u51fa\u4ef7"
};

export default function AuctionPage() {
  const params = useParams<{ id: string }>();
  const { user, loading } = useSessionUser();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [premium, setPremium] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const detail = await api<{ auction: Auction; leaderboard: LeaderboardRow[] }>(`/auctions/${params.id}`);
    setAuction(detail.auction);
    setLeaderboard(detail.leaderboard);
    if (detail.auction.my_bid) {
      setPremium(String(detail.auction.my_bid.premium));
      setQuantity(String(detail.auction.my_bid.quantity));
    }
  }, [params.id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    const channel = supabase
      .channel(`auction-${params.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids", filter: `auction_id=eq.${params.id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, load]);

  async function saveBid(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api(`/auctions/${params.id}/bid`, {
        method: "POST",
        body: JSON.stringify({ premium: Number(premium), quantity: Number(quantity) })
      });
      setMessage(t.saved);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !auction) return <main className="p-6 text-sm text-neutral-500">{t.loading}</main>;

  return (
    <AppShell user={user}>
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="space-y-3">
            <Link href="/buyer" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white shadow-sm">
              <ArrowLeft size={17} />
              {t.backHome}
            </Link>
            <div>
              <div className="text-sm font-semibold uppercase text-moss">{auction.sku}</div>
              <h1 className="mt-1 text-2xl font-semibold">{auction.product_name}</h1>
            </div>
          </div>
          <Panel className="rounded-lg border p-4">
            <div className="grid grid-cols-3 gap-4">
              <Stat label={t.inventory} value={auction.inventory} />
              <Stat label={t.highestPremium} value={`${auction.highest_premium}%`} />
              <Stat label={t.remainingTime} value={remainingText(auction.end_time)} />
            </div>
          </Panel>
          <Panel className="overflow-hidden rounded-lg border">
            <div className="border-b border-line px-4 py-3">
              <h2 className="font-semibold">{t.leaderboard}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-field text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">{t.username}</th>
                    <th className="px-4 py-3">{t.premium}</th>
                    <th className="px-4 py-3">{t.quantity}</th>
                    <th className="px-4 py-3">{t.updatedAt}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row) => (
                    <tr key={row.id} className={row.is_mine ? "bg-green-50" : "border-t border-line"}>
                      <td className="px-4 py-3 font-semibold">{row.username}{row.is_mine ? ` \u00b7 ${t.me}` : ""}</td>
                      <td className="px-4 py-3">{row.premium}%</td>
                      <td className="px-4 py-3">{row.quantity}</td>
                      <td className="px-4 py-3">{formatTime(row.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <Panel className="h-fit rounded-lg border p-4">
          <form onSubmit={saveBid} className="space-y-4">
            <div className="flex items-center gap-2">
              <Timer size={18} />
              <h2 className="font-semibold">{t.formTitle}</h2>
            </div>
            <Label>
              {t.premiumLabel}
              <Input type="number" min="0" step="0.01" required value={premium} onChange={(event) => setPremium(event.target.value)} />
            </Label>
            <Label>
              {t.quantityLabel}
              <Input type="number" min="1" step="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </Label>
            {message && <p className="rounded-md bg-field p-3 text-sm text-neutral-700">{message}</p>}
            <Button className="w-full" disabled={saving}>
              <Save size={16} />
              {saving ? t.saving : t.saveBid}
            </Button>
          </form>
        </Panel>
      </main>
    </AppShell>
  );
}
