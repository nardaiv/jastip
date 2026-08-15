"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Package, Clock, CheckCircle2, Truck, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { shipItemWithFedEx } from "@/app/actions/shipping";
import { sendRequestStatusEmail, updateRequestStatusAction } from "@/app/actions/email";

interface ItemRequest {
  id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  image_url: string | null;
  status: "pending" | "accepted" | "rejected" | "purchased" | "paid" | "shipped" | "delivered" | "cancelled";
  total_price: number | null;
  profiles: {
    full_name: string | null;
    phone_number: string | null;
  } | null;
}

export default function TripRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [tripId]);

  async function fetchRequests() {
    setLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("item_requests")
      .select(`
        id,
        item_name,
        description,
        quantity,
        image_url,
        status,
        total_price,
        profiles:buyer_id (full_name, phone_number)
      `)
      .eq("trip_id", tripId)
      .in("status", ["pending", "accepted", "purchased", "paid"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data as unknown as ItemRequest[]);
    }
    setLoading(false);
  }

  const handleMarkAsPurchased = async (requestId: string) => {
    setProcessingId(requestId);
    const res = await updateRequestStatusAction(requestId, "purchased");
    setProcessingId(null);

    if (res.success) {
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: "purchased" } : req))
      );
    } else {
      alert(`Gagal mengubah status ke purchased: ${res.error}`);
    }
  };

  const handleShipWithFedEx = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await shipItemWithFedEx(requestId);
      if (res.success) {
        alert(`Pengiriman FedEx berhasil diproses! Resi: ${res.trackingNumber}`);
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
      } else {
        alert("Gagal memproses pengiriman FedEx.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat memproses FedEx.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-24 pt-8">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        
        {/* Header Tanpa Border Bawah */}
        <div className="flex flex-col gap-4 pb-4">
          <div className="flex items-start gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full shrink-0 h-10 w-10 border-none shadow-sm bg-background hover:bg-muted ring-0"
              onClick={() => router.push("/seller/trip")}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Daftar Titipan Trip <Package className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola permintaan barang dari buyer untuk perjalanan ini.
              </p>
            </div>
          </div>
        </div>

        {/* Daftar Item */}
        {loading ? (
          <div className="p-16 text-center text-muted-foreground animate-pulse text-sm">
            Memuat daftar request...
          </div>
        ) : requests.length === 0 ? (
          <Card className="p-16 text-center rounded-[2rem] border-none ring-0 shadow-sm space-y-3">
            <div className="w-14 h-14 bg-muted/60 rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="font-semibold text-foreground text-base">Semua Titipan Sudah Beres!</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Tidak ada request baru atau semua barang sudah masuk ke daftar pengiriman (Orders).
            </p>
          </Card>
        ) : (
          <div className="grid gap-5">
            {requests.map((req) => {
              const isPending = req.status === "pending";
              const isAccepted = req.status === "accepted";
              const isPaid = req.status === "paid";
              const isPurchased = req.status === "purchased";
              
              const buyerInfo = req.profiles?.phone_number || req.profiles?.full_name || "Unknown";

              return (
                <Card
                  key={req.id}
                  className="group relative p-6 rounded-[2rem] shadow-sm border-none ring-0 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all hover:shadow-md"
                >
                  {/* Info Barang Kiri */}
                  <div className="flex gap-5 items-center flex-1">
                    <div className="w-24 h-24 bg-muted/30 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
                      {req.image_url ? (
                        <img src={req.image_url} alt={req.item_name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg text-foreground tracking-tight">
                          {req.item_name}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                          x{req.quantity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 pr-4">
                        {req.description || "Tidak ada catatan dari pembeli."}
                      </p>

                      <div className="text-xs font-medium text-muted-foreground pt-1">
                        Buyer: <span className="text-foreground">{buyerInfo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Aksi Kanan */}
                  <div className="flex flex-col items-end justify-between gap-4 w-full md:w-auto h-full self-stretch md:self-auto mt-2 md:mt-0">
                    
                    {isPending && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-blue-500 bg-blue-50/80 dark:bg-blue-500/10">
                        PENDING
                      </span>
                    )}

                    {isAccepted && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-blue-600 bg-blue-50/80 flex items-center gap-1.5 dark:bg-blue-500/10">
                        <Clock className="w-3 h-3" /> ACCEPTED
                      </span>
                    )}
                    
                    {isPurchased && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-amber-500 bg-amber-50/80 flex items-center gap-1.5 dark:bg-amber-500/10">
                        <Clock className="w-3 h-3" /> PURCHASED
                      </span>
                    )}

                    {isPaid && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-emerald-600 bg-emerald-50/80 flex items-center gap-1.5 dark:bg-emerald-500/10">
                        <CheckCircle2 className="w-3 h-3" /> PAID
                      </span>
                    )}

                    {/* Tombol Aksi */}
                    <div className="mt-auto pt-2 w-full md:w-auto">
                      {isPending && (
                        <Link href={`/seller/trip/${tripId}/requests/${req.id}/pricing`} className="w-full md:w-auto">
                          <Button
                            variant="outline"
                            className="w-full md:w-auto h-11 px-8 rounded-full font-semibold bg-background shadow-sm hover:bg-muted border-none ring-0"
                          >
                            Set Price
                          </Button>
                        </Link>
                      )}

                      {isAccepted && (
                        <Button
                          disabled
                          className="w-full md:w-auto h-11 px-6 rounded-full font-semibold gap-2 bg-blue-50 text-blue-700 opacity-80 cursor-not-allowed border-none ring-0"
                        >
                          <Clock className="w-4 h-4" /> Menunggu Pembayaran Buyer
                        </Button>
                      )}

                      {isPaid && (
                        <Button
                          onClick={() => handleMarkAsPurchased(req.id)}
                          disabled={processingId === req.id}
                          className="w-full md:w-auto h-11 px-6 rounded-full font-semibold gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 shadow-sm border-none ring-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {processingId === req.id ? "Memproses..." : "Tandai Sudah Dibeli"}
                        </Button>
                      )}

                      {isPurchased && (
                        <Button
                          onClick={() => handleShipWithFedEx(req.id)}
                          disabled={processingId === req.id}
                          className="w-full md:w-auto h-11 px-6 rounded-full font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border-none ring-0"
                        >
                          <Truck className="w-4 h-4" /> 
                          {processingId === req.id ? "Memproses..." : "Kirim dengan FedEx"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}