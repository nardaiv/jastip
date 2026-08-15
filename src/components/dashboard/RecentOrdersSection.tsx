"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package } from "lucide-react";

export interface RecentOrderItem {
  id: string;
  item_name: string;
  quantity: number;
  total_price: number | null;
  jastip_fee: number | null;
  status: string;
  image_url: string | null;
  created_at: string;
  buyer_name: string;
  trip_title: string;
}

interface RecentOrdersSectionProps {
  orders: RecentOrderItem[];
  userRole?: string;
}

export function RecentOrdersSection({
  orders,
  userRole = "seller",
}: RecentOrdersSectionProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "shipped":
      case "delivered":
      case "paid":
        return "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400";
      case "accepted":
      case "purchased":
        return "text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400";
      case "rejected":
      case "cancelled":
        return "text-red-700 bg-red-50 dark:bg-red-500/10 dark:text-red-400";
      case "pending":
      default:
        return "text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Dibayar";
      case "shipped":
        return "Dikirim";
      case "delivered":
        return "Selesai";
      case "purchased":
        return "Dibelikan";
      case "accepted":
        return "Diterima";
      case "rejected":
        return "Ditolak";
      case "cancelled":
        return "Batal";
      case "pending":
      default:
        return "Menunggu";
    }
  };

  return (
    <Card className="p-6 sm:p-7 rounded-3xl border border-black/[0.04] dark:border-white/[0.05] shadow-xs bg-white dark:bg-zinc-900 space-y-5">
      
      {/* Minimal Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Aktivitas Pesanan Terbaru
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar transaksi titipan yang baru masuk
          </p>
        </div>

        {userRole === "seller" && orders.length > 0 && (
          <Link href="/seller/orders">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-muted/20 space-y-1.5">
          <p className="font-semibold text-foreground text-xs">Belum ada pesanan titipan</p>
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
            Transaksi masuk akan otomatis tampil di sini.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-muted/30">
          {orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center border border-black/[0.03]">
                  {order.image_url ? (
                    <img
                      src={order.image_url}
                      alt={order.item_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate max-w-[200px] sm:max-w-[320px]">
                      {order.item_name}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                      x{order.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.buyer_name} • {order.trip_title}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto self-stretch sm:self-auto">
                <div className="text-left sm:text-right">
                  <div className="text-xs font-bold text-foreground">
                    Rp {(order.total_price || 0).toLocaleString("id-ID")}
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-primary font-medium">
                    +Fee Rp {(order.jastip_fee || 0).toLocaleString("id-ID")}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${getStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
