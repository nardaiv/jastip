"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  fetchBuyerRequestById,
  fetchTrackingData,
} from "@/lib/services/data-service";
import { getShipmentTracking } from "@/app/actions/shipping";
import { BuyerRequest, TrackingShipment } from "@/types/buyer";
import { ArrowLeft, Clock, CreditCard, CheckCircle2, ShoppingBag, XCircle, Ban } from "lucide-react";

function TrackingContent() {
  const params = useParams();
  const reqId = (params?.id as string) || "REQ-002";

  const [requestItem, setRequestItem] = useState<BuyerRequest | null>(null);
  const [tracking, setTracking] = useState<TrackingShipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const reqData = await fetchBuyerRequestById(reqId);
        setRequestItem(reqData);

        const trackData = await fetchTrackingData(reqId);
        setTracking(trackData);

        // If shipment exists and has a real tracking number, trigger FedEx live sync
        if (
          trackData &&
          trackData.shipment_id &&
          trackData.resi &&
          trackData.resi !== "Pending Courier Assignment"
        ) {
          const syncRes = await getShipmentTracking(trackData.shipment_id);
          if (syncRes.success) {
            const updatedTrackData = await fetchTrackingData(reqId);
            setTracking(updatedTrackData);
          }
        }
      } catch (e) {
        console.error("Load tracking error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [reqId]);

  const isPending = requestItem?.status === "pending";
  const isShippedOrDelivered = requestItem?.status === "shipped" || requestItem?.status === "delivered";
  const currencyCode = isPending ? (requestItem?.currency || "IDR") : "IDR";

  const quantityVal = requestItem?.quantity || 1;
  const price = (!isPending && requestItem?.agreed_price != null)
    ? requestItem.agreed_price
    : (requestItem?.estimated_price || 0);

  const itemTotalPrice = price * quantityVal;
  const fee = requestItem?.jastip_fee != null
    ? requestItem.jastip_fee
    : Math.round(itemTotalPrice * 0.1);
  const shippingFee = requestItem?.shipping_fee || 0;
  const totalBiaya = requestItem?.total_price || (itemTotalPrice + fee + shippingFee);

  const formatValue = (val: number) => {
    const code = currencyCode.toUpperCase();
    const isZeroDecimal = ["IDR", "JPY", "KRW"].includes(code);
    return new Intl.NumberFormat(code === "IDR" ? "id-ID" : "en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="card-content border border-canvas-soft/85 dark:border-zinc-800/80 p-12 text-center text-muted-foreground max-w-xl mx-auto shadow-md">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-muted-foreground">Menghubungkan ke FedEx Live Tracking...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      {/* Navigation Back */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-body-sm-strong text-muted-foreground hover:text-foreground transition-colors gap-1.5"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Dashboard
        </Link>
      </div>

      {/* Card Header Info Pesanan & FedEx Banner */}
      <div className="card-content border border-canvas-soft/85 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 inline-flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
              {isShippedOrDelivered ? "FedEx Express Active Track" : "Status Pemrosesan Titipan"}
            </span>
            <span className="text-xs font-mono text-muted-foreground bg-canvas-soft/60 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md">
              ID: {requestItem?.id || reqId}
            </span>
          </div>
          <h1 className="text-display-xs sm:text-display-sm text-foreground mt-3 font-extrabold tracking-tight">
            {requestItem?.item_name || "Sony WH-1000XM5 Noise Canceling"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seller: <span className="font-bold text-foreground">{requestItem?.seller_name || "Budi (Jasa Titip JP)"}</span> ({requestItem?.country || "🇯🇵 Jepang"})
          </p>
        </div>

        <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto border-canvas-soft dark:border-zinc-800 bg-canvas-soft/20 md:bg-transparent p-4 md:p-0 rounded-2xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
            Nomor Resi FedEx
          </p>
          <p className="text-xl sm:text-2xl font-mono font-extrabold text-foreground mt-0.5 tracking-wider">
            {isShippedOrDelivered ? (tracking?.resi || "Belum Tersedia") : "Belum Tersedia"}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-400 font-bold mt-1">
            {isShippedOrDelivered ? (tracking?.service_type || "FedEx International Priority®") : "Akan diproses setelah seller mengirimkan barang"}
          </p>
        </div>
      </div>

      {isShippedOrDelivered && (
        /* Timeline Status Visual (Step Indicator) */
        <div className="card-content border border-canvas-soft/85 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8 pb-4 border-b border-canvas-soft dark:border-zinc-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Status Pelacakan Pesanan
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live sync dari gateway logistik internasional
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-muted-foreground">Estimasi Tiba di Alamat Buyer:</span>
              <p className="text-sm font-extrabold text-foreground">
                {tracking?.estimated_delivery || "26 Agustus 2026, 18:00 WIB"}
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="relative border-l-2 border-canvas-soft dark:border-zinc-800 ml-4 sm:ml-6 space-y-8 py-2">
            {tracking?.steps.map((step) => (
              <div key={step.id} className="relative pl-8 sm:pl-10">
                {/* Bullet Node */}
                <div
                  className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-xs transition-all ${
                    step.status === "completed"
                      ? "bg-primary border-primary text-primary-foreground font-extrabold"
                      : step.status === "active"
                        ? "bg-purple-600 border-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-950/20 animate-pulse"
                        : "bg-card border-canvas-soft dark:border-zinc-800 text-muted-foreground"
                  }`}
                >
                  {step.status === "completed" ? "✓" : step.id}
                </div>

                <div>
                  <h3
                    className={`text-base font-bold tracking-tight ${
                      step.status === "pending"
                        ? "text-muted-foreground"
                        : step.status === "active"
                          ? "text-purple-700 dark:text-purple-400 font-extrabold"
                          : "text-foreground"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    {step.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Riwayat (Logs dari FedEx API) & Ringkasan Biaya */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Span 2: Timeline Log / Processing Status Card */}
        <div className="lg:col-span-2">
          {isShippedOrDelivered ? (
            /* Timeline Log Detail */
            <div className="card-content border border-canvas-soft/85 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-canvas-soft dark:border-zinc-800">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    Riwayat Perjalanan (FedEx Activity Log)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Catatan checkpoint bandara & hub logistik
                  </p>
                </div>
                <span className="text-xs bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-3 py-1 rounded-md font-mono font-bold">
                  API Live Sync
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {tracking?.timeline_logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-canvas-soft/20 dark:bg-secondary/20 border border-canvas-soft/80 dark:border-zinc-800/80 text-sm space-y-1.5 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
                      <span className="flex items-center gap-1.5">
                        <span>📍</span>
                        {log.location}
                      </span>
                      <span className="text-muted-foreground font-medium">{log.date}</span>
                    </div>
                    <p className="text-foreground font-medium text-xs sm:text-sm leading-relaxed">
                      {log.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Non-shipped status info card */
            <div className="card-content border border-canvas-soft/85 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm flex flex-col items-center text-center justify-center space-y-6 min-h-[300px]">
              <div className="flex justify-center p-3 rounded-full bg-canvas-soft/40 dark:bg-zinc-800">
                {requestItem?.status === "pending" && <Clock className="w-12 h-12 text-amber-500 animate-pulse" />}
                {requestItem?.status === "verifying" && <Clock className="w-12 h-12 text-blue-500 animate-pulse" />}
                {requestItem?.status === "accepted" && <CreditCard className="w-12 h-12 text-indigo-500" />}
                {requestItem?.status === "paid" && <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-pulse" />}
                {requestItem?.status === "purchased" && <ShoppingBag className="w-12 h-12 text-purple-500" />}
                {requestItem?.status === "rejected" && <XCircle className="w-12 h-12 text-destructive" />}
                {requestItem?.status === "cancelled" && <Ban className="w-12 h-12 text-muted-foreground" />}
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {requestItem?.status === "pending" && "Menunggu Persetujuan Seller"}
                  {requestItem?.status === "verifying" && "Verifikasi Pembayaran"}
                  {requestItem?.status === "accepted" && "Menunggu Pembayaran"}
                  {requestItem?.status === "paid" && "Pembayaran Berhasil"}
                  {requestItem?.status === "purchased" && "Barang Telah Dibeli"}
                  {requestItem?.status === "rejected" && "Permintaan Ditolak"}
                  {requestItem?.status === "cancelled" && "Pesanan Dibatalkan"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {requestItem?.status === "pending" && "Permintaan titipan Anda telah dikirim dan sedang menunggu seller untuk menentukan/menyetujui harga jastip serta ketersediaan barang."}
                  {requestItem?.status === "verifying" && "Bukti pembayaran Anda sudah dikirim dan sedang diverifikasi oleh admin Jastip. Mohon tunggu proses konfirmasi selesai."}
                  {requestItem?.status === "accepted" && "Seller menyetujui titipan Anda! Silakan lakukan pembayaran agar seller dapat membelikan barang titipan Anda."}
                  {requestItem?.status === "paid" && "Pembayaran Anda sudah lunas terverifikasi. Seller telah menerima notifikasi dan akan segera membeli barang Anda."}
                  {requestItem?.status === "purchased" && "Barang titipan Anda sudah sukses dibeli oleh seller di negara tujuan. Seller akan segera mengemas dan mengirim paket Anda."}
                  {requestItem?.status === "rejected" && `Permintaan titipan ditolak oleh seller.${requestItem?.rejection_reason ? ` Alasan: "${requestItem.rejection_reason}"` : ""}`}
                  {requestItem?.status === "cancelled" && "Permintaan titipan ini telah dibatalkan."}
                </p>
              </div>

              {requestItem?.status === "accepted" && (
                <div className="pt-2">
                  <Link
                    href={`/payment?id=${reqId}`}
                    className="inline-flex button-primary text-sm font-bold px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg"
                  >
                    Bayar Sekarang
                  </Link>
                </div>
              )}

              <div className="border-t border-canvas-soft/60 dark:border-zinc-800/80 pt-5 w-full text-xs text-muted-foreground">
                Nomor resi & live tracking dari kurir FedEx akan otomatis aktif di halaman ini setelah barang dikirim oleh seller.
              </div>
            </div>
          )}
        </div>

        {/* Ringkasan Pembayaran & Kontak Seller */}
        <div className="card-content border border-canvas-soft/85 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm h-fit space-y-5">
          <h2 className="text-lg sm:text-xl font-bold text-foreground pb-3 border-b border-canvas-soft dark:border-zinc-800">
            Rincian Pembayaran
          </h2>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Harga Barang Asli {quantityVal > 1 ? `(${quantityVal}x)` : ""}</span>
              <span className="font-semibold text-foreground">{formatValue(itemTotalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fee Jastip</span>
              <span className="font-semibold text-foreground">{formatValue(fee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkos Kirim FedEx</span>
              <span className="font-semibold text-foreground">{formatValue(shippingFee)}</span>
            </div>
            <div className="pt-3 border-t border-canvas-soft dark:border-zinc-800 flex justify-between items-center text-base font-bold text-foreground">
              <span>Total Biaya Lunas</span>
              <span className="text-primary font-bold text-xl">{formatValue(totalBiaya)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">Memuat data pelacakan...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
