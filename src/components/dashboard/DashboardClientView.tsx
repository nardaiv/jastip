"use client";

import { useState, useMemo } from "react";
import { DashboardStatsCards } from "./DashboardStatsCards";
import { SalesAnalyticsChart, ChartDataPoint } from "./SalesAnalyticsChart";
import { OrderDistributionChart } from "./OrderDistributionChart";
import { RecentOrdersSection, RecentOrderItem } from "./RecentOrdersSection";
import { DashboardProfileGrid } from "@/components/DashboardProfileGrid";
import { ProfileForm } from "@/components/ProfileForm";
import { LayoutDashboard, Settings } from "lucide-react";
import { DashboardClient } from "@/components/DashboardClient";

export interface DashboardRawOrder {
  id: string;
  item_name: string;
  quantity: number;
  agreed_price: number | null;
  jastip_fee: number | null;
  shipping_fee: number | null;
  total_price: number | null;
  status: string;
  image_url: string | null;
  created_at: string;
  buyer_name?: string;
  trip_title?: string;
}

interface DashboardClientViewProps {
  userId: string;
  userRole: string;
  userEmail: string;
  userName: string;
  orders: DashboardRawOrder[];
  activeTripsCount: number;
  initialAddresses: any[];
}

export function DashboardClientView({
  userId,
  userRole,
  userEmail,
  userName,
  orders,
  activeTripsCount,
  initialAddresses,
}: DashboardClientViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");

  // 1. Calculate KPI Metrics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let completedOrders = 0;
    let pendingOrders = 0;

    orders.forEach((order) => {
      if (order.status !== "cancelled" && order.status !== "rejected") {
        const orderRevenue = order.total_price || ((order.agreed_price || 0) + (order.jastip_fee || 0) + (order.shipping_fee || 0));
        const orderProfit = order.jastip_fee || 0;

        totalRevenue += orderRevenue;
        totalProfit += orderProfit;

        if (order.status === "delivered" || order.status === "shipped" || order.status === "paid") {
          completedOrders += 1;
        } else {
          pendingOrders += 1;
        }
      }
    });

    const totalOrders = orders.length;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalProfit,
      totalOrders,
      completedOrders,
      pendingOrders,
      profitMargin,
    };
  }, [orders]);

  // 2. Format Order Distribution Data
  const distributionData = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      purchased: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const s = order.status.toLowerCase();
      if (counts[s] !== undefined) {
        counts[s] += 1;
      } else {
        counts.pending += 1;
      }
    });

    return [
      { name: "Selesai", count: counts.delivered, color: "#10b981", status: "delivered" },
      { name: "Dikirim", count: counts.shipped, color: "#38c8ff", status: "shipped" },
      { name: "Dibayar", count: counts.paid, color: "#9fe870", status: "paid" },
      { name: "Dibelikan", count: counts.purchased, color: "#818cf8", status: "purchased" },
      { name: "Menunggu", count: counts.pending, color: "#f59e0b", status: "pending" },
    ];
  }, [orders]);

  // 3. Build Timeline Series for Recharts (Daily, Weekly, Monthly)
  const { dailyData, weeklyData, monthlyData } = useMemo(() => {
    const now = new Date();

    // -- A. Daily Data (Last 7 Days)
    const dailyMap = new Map<string, { revenue: number; profit: number; orders: number; label: string }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      dailyMap.set(dateKey, { revenue: 0, profit: 0, orders: 0, label });
    }

    // -- B. Weekly Data (Last 4 Weeks)
    const weeklyList: { date: string; label: string; revenue: number; profit: number; orders: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const startW = new Date(now);
      startW.setDate(startW.getDate() - (w * 7 + 6));
      const endW = new Date(now);
      endW.setDate(endW.getDate() - (w * 7));
      weeklyList.push({
        date: `W${4 - w}`,
        label: `Mgg ${4 - w} (${endW.toLocaleDateString("id-ID", { month: "short" })})`,
        revenue: 0,
        profit: 0,
        orders: 0,
      });
    }

    // -- C. Monthly Data (Last 6 Months)
    const monthlyList: { date: string; label: string; revenue: number; profit: number; orders: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      monthlyList.push({
        date: monthKey,
        label,
        revenue: 0,
        profit: 0,
        orders: 0,
      });
    }

    orders.forEach((order) => {
      if (order.status === "cancelled" || order.status === "rejected") return;

      const orderDate = new Date(order.created_at || new Date());
      const dateKey = orderDate.toISOString().split("T")[0];
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
      
      const rev = order.total_price || ((order.agreed_price || 0) + (order.jastip_fee || 0));
      const prof = order.jastip_fee || 0;

      if (dailyMap.has(dateKey)) {
        const item = dailyMap.get(dateKey)!;
        item.revenue += rev;
        item.profit += prof;
        item.orders += 1;
      }

      const mItem = monthlyList.find((m) => m.date === monthKey);
      if (mItem) {
        mItem.revenue += rev;
        mItem.profit += prof;
        mItem.orders += 1;
      }

      const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 28) {
        const weekIndex = 3 - Math.floor(diffDays / 7);
        if (weeklyList[weekIndex]) {
          weeklyList[weekIndex].revenue += rev;
          weeklyList[weekIndex].profit += prof;
          weeklyList[weekIndex].orders += 1;
        }
      }
    });

    const dailyArr: ChartDataPoint[] = Array.from(dailyMap.entries()).map(([key, val]) => ({
      date: key,
      label: val.label,
      revenue: val.revenue,
      profit: val.profit,
      orders: val.orders,
    }));

    return {
      dailyData: dailyArr,
      weeklyData: weeklyList,
      monthlyData: monthlyList,
    };
  }, [orders]);

  // 4. Format Recent Orders
  const recentOrdersList: RecentOrderItem[] = useMemo(() => {
    return orders.map((o) => ({
      id: o.id,
      item_name: o.item_name,
      quantity: o.quantity,
      total_price: o.total_price,
      jastip_fee: o.jastip_fee,
      status: o.status,
      image_url: o.image_url,
      created_at: o.created_at,
      buyer_name: o.buyer_name || "Buyer",
      trip_title: o.trip_title || "Trip",
    }));
  }, [orders]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Clean Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Halo, {userName || "Traveller"}! 👋
            </h1>
            <span className="capitalize text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#9fe870]/25 text-emerald-800 dark:text-primary">
              {userRole}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {userRole === "seller" ? "Ringkasan omset dan pesanan titipan Anda." : "Ringkasan pesanan titipan Anda."}
          </p>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="inline-flex items-center bg-muted/40 p-1 rounded-2xl border border-black/[0.03] dark:border-white/[0.03] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Profil & Akun
          </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          {/* 1. KPI Stats Cards (3 Columns) */}
          {userRole !== "admin" && userRole !== "buyer" && (
            <DashboardStatsCards
              totalRevenue={stats.totalRevenue}
              totalProfit={stats.totalProfit}
              totalOrders={stats.totalOrders}
              completedOrders={stats.completedOrders}
              pendingOrders={stats.pendingOrders}
              profitMargin={stats.profitMargin}
            />
          )}

          {/* 2. Charts Row (Sales & Order Distribution) */}
          {userRole !== "admin" && userRole !== "buyer" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-8 flex flex-col">
                <SalesAnalyticsChart
                  dailyData={dailyData}
                  weeklyData={weeklyData}
                  monthlyData={monthlyData}
                />
              </div>

              <div className="lg:col-span-4 flex flex-col">
                <OrderDistributionChart
                  data={distributionData}
                  totalOrders={stats.totalOrders}
                />
              </div>
            </div>
          )}

          {/* 3. Recent Orders Full Width */}
          <RecentOrdersSection
            orders={recentOrdersList}
            userRole={userRole}
          />
        </div>
      ) : (
        /* Settings & Profile Tab */
        <div className="max-w-3xl mx-auto pt-2">
          <DashboardClient
            userId={userId}
            userEmail={userEmail}
            initialAddresses={initialAddresses}
          />
        </div>
      )}

    </div>
  );
}
