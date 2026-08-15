"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

export type Timeframe = "daily" | "weekly" | "monthly";

export interface ChartDataPoint {
  date: string;
  label: string;
  revenue: number;
  profit: number;
  orders: number;
}

interface SalesAnalyticsChartProps {
  dailyData: ChartDataPoint[];
  weeklyData: ChartDataPoint[];
  monthlyData: ChartDataPoint[];
}

export function SalesAnalyticsChart({
  dailyData,
  weeklyData,
  monthlyData,
}: SalesAnalyticsChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("daily");

  const currentData = 
    timeframe === "daily" 
      ? dailyData 
      : timeframe === "weekly" 
      ? weeklyData 
      : monthlyData;

  const formatRupiah = (val: number) =>
    `Rp ${Math.round(val).toLocaleString("id-ID")}`;

  const formatShortRupiah = (val: number) => {
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`;
    return `Rp ${val}`;
  };

  return (
    <Card className="p-6 sm:p-7 rounded-3xl border border-black/[0.04] dark:border-white/[0.05] shadow-xs bg-white dark:bg-zinc-900 flex-1 flex flex-col justify-between space-y-6">
      
      {/* Minimalist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Grafik Penjualan
          </h2>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[#9fe870]" />
              <span>Fee Jastip</span>
            </div>
          </div>
        </div>

        {/* Minimalist Timeframe Switcher */}
        <div className="inline-flex items-center bg-muted/40 p-1 rounded-2xl border border-black/[0.03] dark:border-white/[0.03] self-start sm:self-auto">
          {(["daily", "weekly", "monthly"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                timeframe === tf
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf === "daily" ? "Harian" : tf === "weekly" ? "Mingguan" : "Bulanan"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[270px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={currentData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>

              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9fe870" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#9fe870" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid 
              strokeDasharray="4 4" 
              vertical={false} 
              className="stroke-muted/30" 
            />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#868685", fontSize: 11 }}
              dy={6}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#868685", fontSize: 11 }}
              tickFormatter={formatShortRupiah}
              dx={-4}
            />

            <Tooltip content={<CustomTooltip formatRupiah={formatRupiah} />} />

            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />

            <Area
              type="monotone"
              dataKey="profit"
              name="Fee Jastip"
              stroke="#7dc740"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </Card>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: ChartDataPoint;
  }>;
  label?: string;
  formatRupiah: (val: number) => string;
}

function CustomTooltip({ active, payload, formatRupiah }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="rounded-2xl bg-white/95 dark:bg-zinc-900/95 p-3.5 shadow-lg border border-black/[0.06] dark:border-white/[0.08] text-xs space-y-2 min-w-[180px] backdrop-blur-md">
        <div className="font-bold text-foreground pb-1 border-b border-muted/40">
          {data.date || data.label}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Revenue:</span>
            <span className="font-bold text-foreground">{formatRupiah(data.revenue)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Fee Jastip:</span>
            <span className="font-bold text-emerald-700 dark:text-primary">{formatRupiah(data.profit)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
