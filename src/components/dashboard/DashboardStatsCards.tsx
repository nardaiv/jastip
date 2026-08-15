"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, Coins, ShoppingBag } from "lucide-react";

interface StatsProps {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  profitMargin: number;
}

export function DashboardStatsCards({
  totalRevenue,
  totalProfit,
  totalOrders,
  completedOrders,
  pendingOrders,
  profitMargin,
}: StatsProps) {
  const formatRupiah = (val: number) =>
    `Rp ${Math.round(val).toLocaleString("id-ID")}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Total Revenue */}
      <Card className="p-6 rounded-3xl border border-black/[0.04] dark:border-white/[0.05] shadow-xs bg-white dark:bg-zinc-900 transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Revenue
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {formatRupiah(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Akumulasi nilai transaksi titipan
          </p>
        </div>
      </Card>

      {/* 2. Keuntungan (Fee Jastip) */}
      <Card className="p-6 rounded-3xl border border-black/[0.04] dark:border-white/[0.05] shadow-xs bg-white dark:bg-zinc-900 transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Keuntungan (Fee Jastip)
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#9fe870]/25 text-emerald-800 dark:text-primary flex items-center justify-center">
            <Coins className="w-4 h-4 text-emerald-700 dark:text-primary" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {formatRupiah(totalProfit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Margin fee bersih <span className="font-semibold text-foreground">({profitMargin.toFixed(1)}%)</span>
          </p>
        </div>
      </Card>

      {/* 3. Jumlah Pesanan */}
      <Card className="p-6 rounded-3xl border border-black/[0.04] dark:border-white/[0.05] shadow-xs bg-white dark:bg-zinc-900 transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Jumlah Pesanan
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {totalOrders} <span className="text-base font-normal text-muted-foreground">Pesanan</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {completedOrders} selesai • {pendingOrders} sedang diproses
          </p>
        </div>
      </Card>
    </div>
  );
}
