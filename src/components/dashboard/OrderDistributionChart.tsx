"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface DistributionItem {
  name: string;
  count: number;
  color: string;
  status: string;
}

interface OrderDistributionChartProps {
  data: DistributionItem[];
  totalOrders: number;
}

export function OrderDistributionChart({
  data,
  totalOrders,
}: OrderDistributionChartProps) {
  const filteredData = data.filter((item) => item.count > 0);
  const displayData = filteredData.length > 0 ? filteredData : [{ name: "Belum Ada", count: 1, color: "#e8ebe6", status: "none" }];

  return (
    <Card className="p-6 sm:p-7 rounded-3xl border border-black/[0.04] dark:border-white/[0.05] shadow-xs bg-white dark:bg-zinc-900 flex-1 flex flex-col justify-between space-y-6">
      
      {/* Minimal Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          Status Pesanan
        </h3>
        <span className="text-xs font-semibold text-muted-foreground">
          {totalOrders} Total
        </span>
      </div>

      {/* Donut Chart */}
      <div className="relative h-[180px] w-full flex items-center justify-center my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DistributionItem;
                  if (item.status === "none") return null;
                  const percent = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(0) : "0";
                  return (
                    <div className="rounded-xl bg-white/95 dark:bg-zinc-900/95 p-2.5 shadow-md border border-black/[0.06] text-xs">
                      <p className="font-semibold text-foreground">
                        {item.name}: {item.count} ({percent}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={displayData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={74}
              paddingAngle={filteredData.length > 1 ? 3 : 0}
              stroke="none"
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold tracking-tight text-foreground">
            {totalOrders}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Titipan
          </span>
        </div>
      </div>

      {/* Compact Legend */}
      <div className="space-y-1 pt-2 border-t border-muted/30">
        {data.map((item) => {
          const percentage = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(0) : "0";
          return (
            <div
              key={item.status}
              className="flex items-center justify-between text-xs py-1"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-semibold text-foreground">
                {item.count} <span className="font-normal text-muted-foreground text-[11px]">({percentage}%)</span>
              </span>
            </div>
          );
        })}
      </div>

    </Card>
  );
}
