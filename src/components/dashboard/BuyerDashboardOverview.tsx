"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchBuyerRequests,
  fetchSellerTrips,
  updateRequestStatus,
} from "@/lib/services/data-service";
import { createClient } from "@/lib/supabase/client";
import { BuyerRequest, SellerTrip } from "@/types/buyer";
import { AddressManager } from "@/components/AddressManager";
import {
  ShoppingBag,
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Truck,
  MapPin,
  XCircle
} from "lucide-react";

export function BuyerDashboardOverview() {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [trips, setTrips] = useState<SellerTrip[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"requests" | "addresses">("requests");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          const [reqsData, tripsData, addrRes] = await Promise.all([
            fetchBuyerRequests(),
            fetchSellerTrips(),
            supabase
              .from("shipping_addresses")
              .select("*")
              .eq("user_id", user.id)
              .order("is_default", { ascending: false }),
          ]);
          setRequests(reqsData);
          setTrips(tripsData);
          setAddresses(addrRes.data || []);
        }
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCancelRequest = async (id: string) => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin membatalkan request ini karena harga tidak sesuai?"
    );
    if (!isConfirmed) return;

    setCancellingId(id);
    try {
      await updateRequestStatus(id, "cancelled");
      setRequests((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "cancelled" } : item
        )
      );
    } catch (e) {
      console.error("Cancel request error:", e);
    } finally {
      setCancellingId(null);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="space-y-8">
      {/* Header Dashboard & Quick Action Bar */}
      <div className="card-content flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wise-green-pale text-ink-deep text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-wise-green animate-pulse"></span>
            Buyer Platform
          </div>
          <h1 className="text-display-sm font-bold text-foreground">
            Dashboard Buyer
          </h1>
          <p className="text-body-md text-muted-foreground mt-1.5">
            Kelola pesanan titipan barang luar negeri dan pantau jadwal trip seller aktif.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="#trips"
            onClick={() => setActiveTab("requests")}
            className="button-primary gap-2"
          >
            <Plus className="w-5 h-5" />
            Buat Request Barang
          </Link>
          <Link
            href="/tracking"
            className="button-tertiary gap-2"
          >
            <Truck className="w-5 h-5" />
            Lacak FedEx
          </Link>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-4 text-body-lg font-bold transition-all relative cursor-pointer ${
            activeTab === "requests"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pesanan & Trip Aktif
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={`pb-4 text-body-lg font-bold transition-all relative cursor-pointer ${
            activeTab === "addresses"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Alamat Pengiriman
        </button>
      </div>

      {/* Tab: Requests and Trips */}
      {activeTab === "requests" && (
        <div className="space-y-8">
          {/* Status Request Barang Anda */}
          <div className="space-y-6" id="status">
            <div className="flex items-center justify-between">
              <h2 className="text-display-xs font-bold text-foreground">
                Daftar Titipan & Status Request
              </h2>
              <span className="text-caption font-semibold px-3 py-1 rounded-full bg-card border border-border text-muted-foreground">
                {requests.length} Permintaan
              </span>
            </div>

            {loading ? (
              <div className="bg-card rounded-2xl p-12 text-center text-muted-foreground border border-border/10">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="font-semibold text-sm">Memuat daftar request...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-card rounded-2xl p-12 text-center border border-border/10 space-y-4">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-body-lg font-bold text-foreground">Belum Ada Request Titipan</h3>
                <p className="text-body-sm text-muted-foreground max-w-md mx-auto">
                  Kamu belum memiliki request barang titipan. Mulai buat pesanan pertamamu sekarang!
                </p>
                <a
                  href="#trips"
                  className="button-primary text-sm py-2 px-5"
                >
                  + Buat Request Pertama
                </a>
              </div>
            ) : (
              <div className="space-y-5">
                {requests.map((item) => {
                  const priceVal = item.estimated_price || 0;
                  const quantityVal = item.quantity || 1;
                  const totalBiaya = priceVal * quantityVal + (item.jastip_fee || 0) + (item.shipping_fee || 0);

                  return (
                    <div
                      key={item.id}
                      className="bg-card border border-border/10 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center"
                    >
                      {/* Informasi Barang */}
                      <div className="flex items-start gap-4 sm:gap-5 w-full lg:w-auto">
                        <div className="w-20 h-20 bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground font-mono text-xs border border-border/10 shrink-0 overflow-hidden relative">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.item_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="w-6 h-6" />
                          )}
                        </div>

                        <div className="grow">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="text-body-lg font-bold text-foreground">
                              {item.item_name}
                            </h3>
                            <span className="text-caption px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold border border-border/10">
                              x{item.quantity}
                            </span>
                          </div>
                          <p className="text-caption text-muted-foreground font-mono mt-0.5">
                            ID: {item.id}
                          </p>
                          {item.description && (
                            <p className="text-body-sm text-muted-foreground mt-1 line-clamp-2 max-w-md">
                              Catatan: {item.description}
                            </p>
                          )}

                          <div className="grow mt-2.5 text-caption text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                            <p>
                              Seller: <span className="text-foreground font-semibold">{item.seller_name}</span>
                            </p>
                            <p>
                              Negara: <span className="text-foreground font-semibold">{item.country}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sisi Kanan: Status, Estimasi Total Harga, & Action Buttons */}
                      <div className="flex flex-col items-start lg:items-end gap-3.5 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-border/10">
                        {/* Tag Status */}
                        <div>
                          {item.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wider">
                              <Clock className="w-3.5 h-3.5 animate-pulse" />
                              Pending
                            </span>
                          )}
                          {item.status === "accepted" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accepted
                            </span>
                          )}
                          {item.status === "paid" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-wise-green-pale text-ink-deep border border-primary/20 uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Paid
                            </span>
                          )}
                          {item.status === "purchased" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 uppercase tracking-wider">
                              <Package className="w-3.5 h-3.5" />
                              Purchased
                            </span>
                          )}
                          {item.status === "shipped" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground uppercase tracking-wider">
                              <Truck className="w-3.5 h-3.5" />
                              Shipped
                            </span>
                          )}
                          {item.status === "rejected" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-negative-bg text-negative border border-negative/20 uppercase tracking-wider">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejected
                            </span>
                          )}
                          {item.status === "cancelled" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/10 uppercase tracking-wider">
                              <XCircle className="w-3.5 h-3.5" />
                              Cancelled
                            </span>
                          )}
                        </div>

                        {/* Total Biaya */}
                        <div className="text-left lg:text-right">
                          <p className="text-caption text-muted-foreground font-medium">Estimasi Total Biaya</p>
                          <p className="text-body-lg font-bold text-foreground tracking-tight">
                            {formatRupiah(totalBiaya)}
                          </p>
                          <p className="text-caption text-muted-foreground mt-0.5">
                            Barang: {formatRupiah(item.estimated_price || 0)} • Fee: {formatRupiah(item.jastip_fee || 0)} • Ongkir: {formatRupiah(item.shipping_fee || 0)}
                          </p>
                        </div>

                        {/* Tombol / Keterangan Aksi Berdasarkan Status */}
                        <div className="w-full lg:w-auto">
                          {item.status === "pending" && (
                            <div className="text-caption text-amber-600 bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-500/20 text-center lg:text-right font-medium flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              Request terkirim (Menunggu respon & konfirmasi harga seller)
                            </div>
                          )}

                          {item.status === "accepted" && (
                            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                              <Link
                                href={`/confirmation?id=${item.id}`}
                                className="button-primary text-sm py-2 px-4 text-center cursor-pointer"
                              >
                                ✓ Konfirmasi & Bayar
                              </Link>
                              <button
                                onClick={() => handleCancelRequest(item.id)}
                                disabled={cancellingId === item.id}
                                className="button-tertiary text-sm py-2 px-4 cursor-pointer text-center w-full sm:w-auto text-negative border-negative hover:bg-negative-bg"
                              >
                                {cancellingId === item.id ? "Membatalkan..." : "Batalkan Request"}
                              </button>
                            </div>
                          )}

                          {item.status === "paid" && (
                            <div className="text-caption text-ink-deep bg-wise-green-pale px-4 py-2.5 rounded-xl border border-primary/20 text-center lg:text-right font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Pembayaran diverifikasi. Menunggu seller membeli barang.
                            </div>
                          )}

                          {item.status === "purchased" && (
                            <Link
                              href={`/tracking?id=${item.id}`}
                              className="button-primary text-sm py-2 px-4 text-center cursor-pointer gap-2"
                            >
                              <Truck className="w-4 h-4" />
                              Lacak Status Pesanan
                            </Link>
                          )}

                          {item.status === "shipped" && (
                            <Link
                              href={`/tracking?id=${item.id}`}
                              className="button-primary text-sm py-2 px-4 text-center cursor-pointer gap-2"
                            >
                              <Truck className="w-4 h-4" />
                              Lacak Pengiriman FedEx
                            </Link>
                          )}

                          {item.status === "rejected" && (
                            <div className="text-caption text-negative bg-negative-bg px-4 py-2.5 rounded-xl border border-negative/20 text-center lg:text-right font-medium flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" />
                              Request ditolak oleh seller
                            </div>
                          )}

                          {item.status === "cancelled" && (
                            <div className="text-caption text-muted-foreground bg-muted px-4 py-2.5 rounded-xl border border-border/10 text-center lg:text-right font-medium flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" />
                              Dibatalkan (Harga Tidak Sesuai)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Jadwal Trip Seller Per Negara */}
          <div id="trips" className="bg-card border border-border/10 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/10">
              <div>
                <h2 className="text-display-xs font-bold text-foreground">
                  Jadwal Trip Seller Per Negara
                </h2>
                <p className="text-body-sm text-muted-foreground mt-0.5">
                  Pilih negara destinasi traveler aktif untuk menitip barang impianmu.
                </p>
              </div>
              <span className="text-caption px-3.5 py-1.5 rounded-full bg-wise-green-pale text-ink-deep font-bold border border-primary/20 w-fit flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" />
                Traveler Aktif Terverifikasi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-6 bg-muted/10 border border-border/10 rounded-xl flex flex-col justify-between hover:border-foreground/30 hover:shadow-sm transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl group-hover:scale-105 transition-transform">
                        {trip.flag}
                      </span>
                      <span
                        className={`text-caption px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                          trip.status === "Aktif"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {trip.status}
                      </span>
                    </div>

                    <h3 className="text-body-lg font-bold text-foreground">
                      {trip.country}
                    </h3>
                    <p className="text-body-sm text-muted-foreground mt-1">
                      Seller: <span className="text-foreground font-bold">{trip.seller_name}</span>
                    </p>

                    <div className="mt-4 pt-3 border-t border-border/10 text-caption text-muted-foreground space-y-1.5">
                      <p className="flex items-center gap-1.5">
                        <PlaneTakeoff className="w-3.5 h-3.5" />
                        <span className="font-semibold text-foreground">Berangkat:</span> {trip.departure_date}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <PlaneLanding className="w-3.5 h-3.5" />
                        <span className="font-semibold text-foreground">Kembali:</span> {trip.return_date}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/request?trip_id=${trip.id}`}
                    className="button-tertiary text-sm mt-6 py-2 px-4 text-center w-full"
                  >
                    Request ke Seller Ini →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Edit Address Shipping Manager */}
      {activeTab === "addresses" && (
        <div className="card-content bg-card border border-border/10">
          <div className="pb-4 border-b border-border/10 mb-6">
            <h2 className="text-display-xs font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Kelola Alamat Pengiriman
            </h2>
            <p className="text-body-sm text-muted-foreground mt-1">
              Tambahkan, edit, atau jadikan alamat utama untuk mempermudah proses request pengiriman FedEx.
            </p>
          </div>
          {userId ? (
            <AddressManager userId={userId} initialAddresses={addresses} />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
              Mengautentikasi pengguna...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
