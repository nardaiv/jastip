"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Package, ShoppingBag } from "lucide-react";

interface OrderItem {
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
  profiles: {
    full_name: string | null;
    phone_number: string | null;
  } | null;
  trips: {
    title: string;
    destination_country: string;
  } | null;
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSellerOrders() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("item_requests")
            .select(`
              id,
              item_name,
              quantity,
              agreed_price,
              jastip_fee,
              shipping_fee,
              total_price,
              status,
              image_url,
              created_at,
              profiles:buyer_id (
                full_name,
                phone_number
              ),
              trips:trip_id!inner (
                title,
                destination_country,
                seller_id
              )
            `)
            .eq("trips.seller_id", user.id)
            .order("updated_at", { ascending: false });

          if (error) {
            console.error("Gagal mengambil data pesanan titipan:", error);
          } else if (data) {
            setOrders(data as unknown as OrderItem[]);
          }
        }
      } catch (err) {
        console.error("Error fetching seller orders:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSellerOrders();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "shipped":
      case "delivered":
      case "paid":
        return "text-emerald-600 bg-emerald-50/80 dark:bg-emerald-500/10";
      case "accepted":
        return "text-blue-500 bg-blue-50/80 dark:bg-blue-500/10";
      case "rejected":
      case "cancelled":
        return "text-red-500 bg-red-50/80 dark:bg-red-500/10";
      case "pending":
      case "purchased":
      default:
        return "text-amber-500 bg-amber-50/80 dark:bg-amber-500/10";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="text-sm text-muted-foreground animate-pulse">Memuat daftar titipan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 pt-8">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        
        {/* Header Tanpa Garis Bawah */}
        <div className="flex flex-col gap-2 pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Daftar Titipan Masuk <Package className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau seluruh status pesanan dan rincian tagihan dari buyer Anda.
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="p-16 text-center rounded-[2rem] border-none ring-0 shadow-sm space-y-3">
            <div className="w-14 h-14 bg-muted/60 rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="font-semibold text-foreground text-base">Belum ada pesanan titipan</p>
          </Card>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="group relative p-6 rounded-[2rem] shadow-sm border-none ring-0 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all hover:shadow-md bg-card"
              >
                {/* Kiri: Gambar & Detail Produk */}
                <div className="flex gap-5 items-center flex-1">
                  <div className="w-24 h-24 bg-muted/30 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
                    {order.image_url ? (
                      <img 
                        src={order.image_url} 
                        alt={order.item_name} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground/40" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg text-foreground tracking-tight">
                        {order.item_name}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                        x{order.quantity}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        Buyer: <span className="font-medium text-foreground">{order.profiles?.full_name || "N/A"}</span> ({order.profiles?.phone_number || "-"})
                      </p>
                      <p>
                        Trip: <span className="font-medium text-foreground">{order.trips?.title || "-"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kanan: Status & Nominal Harga */}
                <div className="flex flex-col items-end justify-between gap-3 w-full md:w-auto h-full self-stretch md:self-auto mt-2 md:mt-0">
                  
                  {/* Badge Status */}
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full ${getStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>

                  {/* Ringkasan Harga */}
                  <div className="text-right space-y-0.5 mt-auto">
                    <div className="text-lg font-bold tracking-tight text-primary">
                      Total: Rp {(order.total_price || 0).toLocaleString("id-ID")}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Barang: Rp {(order.agreed_price || 0).toLocaleString("id-ID")} • Jastip: Rp {(order.jastip_fee || 0).toLocaleString("id-ID")}
                      {Boolean(order.shipping_fee) && (
                        <> • Ongkir: Rp {(order.shipping_fee || 0).toLocaleString("id-ID")}</>
                      )}
                    </div>
                  </div>

                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}