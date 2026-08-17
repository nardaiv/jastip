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
import { ArrowLeft } from "lucide-react";

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

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };



  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-slate-500 max-w-xl mx-auto shadow-md">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold">Menghubungkan ke FedEx Live Tracking...</p>
      </div>
    );
  }

  const price = requestItem?.estimated_price || 3296700;
  const fee = requestItem?.jastip_fee || Math.round(price * 0.1);
  const shippingFee = requestItem?.shipping_fee || 35000;
  const totalBiaya = price + fee + shippingFee;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      {/* Navigation Back */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors gap-1.5"
        >
          <ArrowLeft className="mr-5 w-4 h-4" /> Kembali ke Dashboard
        </Link>
      </div>

      {/* Card Header Info Pesanan & FedEx Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
              FedEx Express Active Track
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
              ID: {requestItem?.id || reqId}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-3 tracking-tight">
            {requestItem?.item_name || "Sony WH-1000XM5 Noise Canceling"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Seller: <span className="font-bold text-slate-900">{requestItem?.seller_name || "Budi (Jasa Titip JP)"}</span> ({requestItem?.country || "🇯🇵 Jepang"})
          </p>
        </div>

        <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto border-slate-100 bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-2xl">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
            Nomor Resi FedEx
          </p>
          <p className="text-xl sm:text-2xl font-mono font-extrabold text-slate-950 mt-0.5 tracking-wider">
            {tracking?.resi || "7734 9182 0419"}
          </p>
          <p className="text-xs text-purple-700 font-bold mt-1">
            {tracking?.service_type || "FedEx International Priority®"}
          </p>
        </div>
      </div>

      {/* Timeline Status Visual (Step Indicator) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
              Status Pelacakan Pesanan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live sync dari gateway logistik internasional
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500">Estimasi Tiba di Alamat Buyer:</span>
            <p className="text-sm font-extrabold text-slate-900">
              {tracking?.estimated_delivery || "26 Agustus 2026, 18:00 WIB"}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 space-y-8 py-2">
          {tracking?.steps.map((step) => (
            <div key={step.id} className="relative pl-8 sm:pl-10">
              {/* Bullet Node */}
              <div
                className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-xs transition-all ${step.status === "completed"
                  ? "bg-brand-green border-brand-green text-white"
                  : step.status === "active"
                    ? "bg-purple-600 border-purple-600 text-white ring-4 ring-purple-100 animate-pulse"
                    : "bg-white border-slate-300 text-slate-400"
                  }`}
              >
                {step.status === "completed" ? "✓" : step.id}
              </div>

              <div>
                <h3
                  className={`text-base font-bold tracking-tight ${step.status === "pending"
                    ? "text-slate-400"
                    : step.status === "active"
                      ? "text-purple-700"
                      : "text-slate-950"
                    }`}
                >
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {step.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Riwayat (Logs dari FedEx API) & Ringkasan Biaya */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Log Detail */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-950">
                Riwayat Perjalanan (FedEx Activity Log)
              </h2>
              <p className="text-xs text-slate-500">
                Catatan checkpoint bandara & hub logistik
              </p>
            </div>
            <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-md font-mono font-bold">
              API Live Sync
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {tracking?.timeline_logs.map((log, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm space-y-1.5 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-purple-700">
                  <span className="flex items-center gap-1.5">
                    <span>📍</span>
                    {log.location}
                  </span>
                  <span className="text-slate-400 font-medium">{log.date}</span>
                </div>
                <p className="text-slate-800 font-medium text-xs sm:text-sm leading-relaxed">
                  {log.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Ringkasan Pembayaran & Kontak Seller */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm h-fit space-y-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-950 pb-3 border-b border-slate-100">
            Rincian Pembayaran
          </h2>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Harga Barang Asli</span>
              <span className="font-semibold text-slate-900">{formatRupiah(price)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fee Jastip (10%)</span>
              <span className="font-semibold text-slate-900">{formatRupiah(fee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkos Kirim FedEx</span>
              <span className="font-semibold text-slate-900">{formatRupiah(shippingFee)}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base font-bold text-slate-950">
              <span>Total Biaya Lunas</span>
              <span className="text-brand-green text-xl">{formatRupiah(totalBiaya)}</span>
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
