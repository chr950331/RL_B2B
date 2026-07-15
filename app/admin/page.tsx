"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Plus, RefreshCw, Wand2, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Input, Label, Panel, Select, Stat } from "@/components/ui";
import { api, downloadWithAuth } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Auction, Buyer, LeaderboardRow } from "@/lib/types";
import { useSessionUser } from "@/lib/use-session-user";

type AllocationRow = {
  buyer_id: string;
  username: string;
  premium: number;
  requested_quantity: number;
  allocated_quantity: number;
};

const emptyAuction = {
  sku: "",
  product_name: "",
  product_image: "",
  inventory: 1,
  start_time: "",
  end_time: "",
  status: "draft"
};

const statusText: Record<string, string> = {
  draft: "草稿",
  active: "进行中",
  closed: "已关闭"
};

export default function AdminPage() {
  const { user, loading, error } = useSessionUser();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selected, setSelected] = useState<Auction | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [buyerForm, setBuyerForm] = useState({ username: "", password: "", role: "buyer" });
  const [auctionForm, setAuctionForm] = useState(emptyAuction);
  const [message, setMessage] = useState("");
  const selectedId = selected?.id;

  const loadAll = useCallback(async () => {
    const [auctionRows, buyerRows] = await Promise.all([api<Auction[]>("/auctions"), api<Buyer[]>("/admin/buyers")]);
    setAuctions(auctionRows);
    setBuyers(buyerRows);
    setSelected((current) => current || auctionRows[0] || null);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const detail = await api<{ auction: Auction; leaderboard: LeaderboardRow[] }>(`/auctions/${id}`);
    setSelected(detail.auction);
    setLeaderboard(detail.leaderboard);
  }, []);

  useEffect(() => {
    if (user?.role === "admin") loadAll();
  }, [user, loadAll]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function createBuyer(event: React.FormEvent) {
    event.preventDefault();
    await api("/admin/buyers", { method: "POST", body: JSON.stringify(buyerForm) });
    setBuyerForm({ username: "", password: "", role: "buyer" });
    setMessage("用户已创建");
    await loadAll();
  }

  async function createAuction(event: React.FormEvent) {
    event.preventDefault();
    await api("/admin/auctions", {
      method: "POST",
      body: JSON.stringify({
        ...auctionForm,
        inventory: Number(auctionForm.inventory),
        start_time: new Date(auctionForm.start_time).toISOString(),
        end_time: new Date(auctionForm.end_time).toISOString()
      })
    });
    setAuctionForm(emptyAuction);
    setMessage("场次已创建");
    await loadAll();
  }

  async function patchAuction(id: string, data: Record<string, unknown>) {
    await api(`/admin/auctions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    await loadAll();
    await loadDetail(id);
  }

  async function allocate(id: string) {
    const rows = await api<AllocationRow[]>(`/admin/auctions/${id}/allocate`, { method: "POST" });
    setAllocations(rows);
    setMessage("分配已生成");
  }

  if (loading) return <main className="p-6 text-sm text-neutral-500">加载中...</main>;
  if (user?.role !== "admin") return <main className="p-6 text-sm text-red-700">没有管理员权限。{error}</main>;

  return (
    <AppShell user={user}>
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Panel className="rounded-lg border p-4">
            <form onSubmit={createBuyer} className="space-y-3">
              <h2 className="font-semibold">创建用户</h2>
              <Label>
                用户名
                <Input required minLength={3} pattern="[A-Za-z0-9_.-]+" value={buyerForm.username} onChange={(e) => setBuyerForm({ ...buyerForm, username: e.target.value })} />
              </Label>
              <Label>
                密码
                <Input required type="password" minLength={6} value={buyerForm.password} onChange={(e) => setBuyerForm({ ...buyerForm, password: e.target.value })} />
              </Label>
              <Label>
                角色
                <Select value={buyerForm.role} onChange={(e) => setBuyerForm({ ...buyerForm, role: e.target.value })}>
                  <option value="buyer">买家</option>
                  <option value="admin">管理员</option>
                </Select>
              </Label>
              <Button className="w-full"><Plus size={16} />创建</Button>
            </form>
          </Panel>
          <Panel className="rounded-lg border p-4">
            <form onSubmit={createAuction} className="space-y-3">
              <h2 className="font-semibold">创建场次</h2>
              <Label>SKU<Input required value={auctionForm.sku} onChange={(e) => setAuctionForm({ ...auctionForm, sku: e.target.value })} /></Label>
              <Label>商品名称<Input required value={auctionForm.product_name} onChange={(e) => setAuctionForm({ ...auctionForm, product_name: e.target.value })} /></Label>
              <Label>商品图片 URL<Input value={auctionForm.product_image} onChange={(e) => setAuctionForm({ ...auctionForm, product_image: e.target.value })} /></Label>
              <Label>库存<Input required type="number" min="1" value={auctionForm.inventory} onChange={(e) => setAuctionForm({ ...auctionForm, inventory: Number(e.target.value) })} /></Label>
              <Label>开始时间<Input required type="datetime-local" value={auctionForm.start_time} onChange={(e) => setAuctionForm({ ...auctionForm, start_time: e.target.value })} /></Label>
              <Label>结束时间<Input required type="datetime-local" value={auctionForm.end_time} onChange={(e) => setAuctionForm({ ...auctionForm, end_time: e.target.value })} /></Label>
              <Label>
                状态
                <Select value={auctionForm.status} onChange={(e) => setAuctionForm({ ...auctionForm, status: e.target.value })}>
                  <option value="draft">草稿</option>
                  <option value="active">进行中</option>
                  <option value="closed">已关闭</option>
                </Select>
              </Label>
              <Button className="w-full"><Plus size={16} />创建</Button>
            </form>
          </Panel>
        </div>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">管理员看板</h1>
              <p className="mt-1 text-sm text-neutral-500">所有出价记录都会向买家显示用户名。</p>
            </div>
            <Button variant="secondary" onClick={loadAll}><RefreshCw size={16} />刷新</Button>
          </div>
          {message && <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</p>}
          <Panel className="rounded-lg border">
            <div className="grid gap-3 p-4 md:grid-cols-3">
              <Stat label="买家数" value={buyers.filter((b) => b.role === "buyer").length} />
              <Stat label="场次数" value={auctions.length} />
              <Stat label="当前状态" value={selected ? statusText[selected.status] : "-"} />
            </div>
          </Panel>
          <Panel className="overflow-hidden rounded-lg border">
            <div className="border-b border-line px-4 py-3 font-semibold">场次</div>
            <div className="divide-y divide-line">
              {auctions.map((auction) => (
                <button key={auction.id} onClick={() => setSelected(auction)} className="focus-ring grid w-full gap-2 px-4 py-3 text-left md:grid-cols-[1fr_120px_120px]">
                  <div><div className="font-semibold">{auction.product_name}</div><div className="text-xs text-neutral-500">{auction.sku} · {formatDateTime(auction.end_time)}</div></div>
                  <div className="text-sm">{statusText[auction.status]}</div>
                  <div className="text-sm">库存 {auction.inventory}</div>
                </button>
              ))}
            </div>
          </Panel>
          {selected && (
            <Panel className="overflow-hidden rounded-lg border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
                <div>
                  <div className="font-semibold">{selected.product_name}</div>
                  <div className="text-xs text-neutral-500">{selected.sku}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => patchAuction(selected.id, { status: selected.status === "active" ? "draft" : "active" })}>
                    {selected.status === "active" ? "暂停" : "开启"}
                  </Button>
                  <Button variant="secondary" onClick={() => patchAuction(selected.id, { status: "closed" })}><XCircle size={16} />关闭</Button>
                  <Button variant="secondary" onClick={() => allocate(selected.id)}><Wand2 size={16} />分配</Button>
                  <Button variant="secondary" onClick={() => downloadWithAuth(`/admin/auctions/${selected.id}/export.csv`, `${selected.sku}.csv`)}><Download size={16} />导出 CSV</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-field text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3">用户名</th><th className="px-4 py-3">服务费</th><th className="px-4 py-3">数量</th><th className="px-4 py-3">更新时间</th></tr></thead>
                  <tbody>{leaderboard.map((row) => <tr key={row.id} className="border-t border-line"><td className="px-4 py-3 font-semibold">{row.username}</td><td className="px-4 py-3">{row.premium}%</td><td className="px-4 py-3">{row.quantity}</td><td className="px-4 py-3">{formatDateTime(row.updated_at)}</td></tr>)}</tbody>
                </table>
              </div>
            </Panel>
          )}
          {!!allocations.length && (
            <Panel className="overflow-hidden rounded-lg border">
              <div className="border-b border-line px-4 py-3 font-semibold">分配结果</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-field text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3">用户名</th><th className="px-4 py-3">服务费</th><th className="px-4 py-3">需求数量</th><th className="px-4 py-3">分配数量</th></tr></thead>
                  <tbody>{allocations.map((row) => <tr key={row.buyer_id} className="border-t border-line"><td className="px-4 py-3 font-semibold">{row.username}</td><td className="px-4 py-3">{row.premium}%</td><td className="px-4 py-3">{row.requested_quantity}</td><td className="px-4 py-3">{row.allocated_quantity}</td></tr>)}</tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      </main>
    </AppShell>
  );
}
