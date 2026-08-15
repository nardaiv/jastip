"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchBuyerRequests,
  fetchSellerTrips,
  updateRequestStatus,
} from "@/lib/services/data-service";
import { BuyerRequest, SellerTrip } from "@/types/buyer";

export function BuyerDashboardOverview() {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [trips, setTrips] = useState<SellerTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [reqsData, tripsData] = await Promise.all([
          fetchBuyerRequests(),
          fetchSellerTrips(),
        ]);
        setRequests(reqsData);
        setTrips(tripsData);
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
    <div className="space-y-10">
      
      {/* Header Dashboard & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green-light border border-emerald-200 text-brand-green text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
            Buyer Platform
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
            Dashboard Buyer
          </h1>
          <p className="text-slate-600 mt-1.5 text-base md:text-lg">
            Kelola pesanan titipan barang luar negeri dan pantau jadwal trip seller aktif.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/request"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-green hover:bg-[#43A047] active:scale-95 font-bold rounded-2xl text-white transition-all shadow-md text-base cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Buat Request Barang
          </Link>
          <Link
            href="/tracking"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 font-bold rounded-2xl text-white transition-all shadow-md text-base cursor-pointer"
          >
            Lacak FedEx
          </Link>
        </div>
      </div>

      {/* Status Request Barang Anda */}
      <div className="space-y-6" id="status">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
            Daftar Titipan & Status Request
          </h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
            {requests.length} Permintaan
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
            <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-semibold text-sm">Memuat daftar request...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-3xl">
              🛍️
            </div>
            <h3 className="text-xl font-bold text-slate-900">Belum Ada Request Titipan</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              Kamu belum memiliki request barang titipan. Mulai buat pesanan pertamamu sekarang!
            </p>
            <Link
              href="/request"
              className="inline-block px-6 py-2.5 bg-brand-green text-white font-semibold rounded-xl text-sm shadow-sm hover:opacity-90 transition-all"
            >
              + Buat Request Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((item) => {
              const totalBiaya = (item.price || 0) + (item.fee || 0) + (item.shipping_fee || 0);
              
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-7 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center"
                >
                  {/* Informasi Barang */}
                  <div className="flex items-start gap-4 sm:gap-5 w-full lg:w-auto">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-mono text-xs border border-slate-200 shrink-0 overflow-hidden relative">
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt={item.model}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-semibold text-slate-400">IMG</span>
                      )}
                    </div>

                    <div className="grow">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-lg md:text-xl font-bold text-slate-950 tracking-tight">
                          {item.model}
                        </h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          x{item.kuantitas}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        Merk: <span className="text-slate-900 font-semibold">{item.merk}</span>
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        ID: {item.id}
                      </p>

                      <div className="grow mt-2.5 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                        <p>
                          Seller: <span className="text-slate-900 font-semibold">{item.seller_name}</span>
                        </p>
                        <p>
                          Negara: <span className="text-slate-900 font-semibold">{item.country}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Status, Estimasi Total Harga, & Action Buttons */}
                  <div className="flex flex-col items-start lg:items-end gap-3.5 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    
                    {/* Tag Status */}
                    <div>
                      {item.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                          Pending
                        </span>
                      )}
                      {item.status === "accepted" && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-brand-green-light text-brand-green border border-emerald-300 uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                          Accepted
                        </span>
                      )}
                      {item.status === "purchased" && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Purchased
                        </span>
                      )}
                      {item.status === "rejected" && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                          ✕ Rejected
                        </span>
                      )}
                      {item.status === "cancelled" && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 uppercase tracking-wider">
                          ⊘ Cancelled
                        </span>
                      )}
                    </div>

                    {/* Total Biaya */}
                    <div className="text-left lg:text-right">
                      <p className="text-xs text-slate-500 font-medium">Estimasi Total Biaya</p>
                      <p className="text-2xl md:text-3xl font-extrabold text-brand-green tracking-tight">
                        {formatRupiah(totalBiaya)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Barang: {formatRupiah(item.price || 0)} • Fee: {formatRupiah(item.fee || 0)} • Ongkir: {formatRupiah(item.shipping_fee || 0)}
                      </p>
                    </div>

                    {/* Tombol / Keterangan Aksi Berdasarkan Status */}
                    <div className="w-full lg:w-auto">
                      {item.status === "pending" && (
                        <div className="text-xs text-amber-900 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 text-center lg:text-right font-medium">
                          ⏳ Request terkirim (Menunggu respon & konfirmasi harga seller)
                        </div>
                      )}

                      {item.status === "accepted" && (
                        <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
                          <Link
                            href={`/confirmation?id=${item.id}`}
                            className="px-5 py-2.5 bg-brand-green hover:bg-[#43A047] text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-95 text-center cursor-pointer"
                          >
                            ✓ Konfirmasi Harga & Bayar
                          </Link>
                          <button
                            onClick={() => handleCancelRequest(item.id)}
                            disabled={cancellingId === item.id}
                            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-sm transition-all border border-rose-200 active:scale-95 cursor-pointer text-center w-full sm:w-auto"
                          >
                            {cancellingId === item.id ? "Membatalkan..." : "Batalkan Request"}
                          </button>
                        </div>
                      )}

                      {item.status === "purchased" && (
                        <Link
                          href={`/tracking?id=${item.id}`}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm active:scale-95 w-full lg:w-auto text-center"
                        >
                          <span>📦</span>
                          Lacak Status Pesanan
                        </Link>
                      )}

                      {item.status === "rejected" && (
                        <div className="text-xs text-rose-700 bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200 text-center lg:text-right font-medium">
                          ❌ Request ditolak oleh seller
                        </div>
                      )}

                      {item.status === "cancelled" && (
                        <div className="text-xs text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 text-center lg:text-right font-medium">
                          🚫 Dibatalkan (Harga Tidak Sesuai)
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
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
              Jadwal Trip Seller Per Negara
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Pilih negara destinasi traveler aktif untuk menitip barang impianmu.
            </p>
          </div>
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-brand-green-light text-brand-green font-bold border border-emerald-200 w-fit">
            ✈️ Traveler Aktif Terverifikasi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="p-6 bg-brand-green-light/70 border border-emerald-200/80 rounded-2xl flex flex-col justify-between hover:border-brand-green hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl group-hover:scale-110 transition-transform">
                    {trip.flag}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                      trip.status === "Aktif"
                        ? "bg-brand-green text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {trip.status}
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                  {trip.country}
                </h3>
                <p className="text-sm text-slate-700 mt-1">
                  Seller: <span className="text-slate-950 font-bold">{trip.seller_name}</span>
                </p>

                <div className="mt-4 pt-3 border-t border-emerald-200 text-xs text-slate-700 space-y-1.5">
                  <p className="flex items-center gap-1.5">
                    <span>🛫</span>
                    <span className="font-semibold text-slate-900">Berangkat:</span> {trip.departure_date}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>🛬</span>
                    <span className="font-semibold text-slate-900">Kembali:</span> {trip.return_date}
                  </p>
                </div>
              </div>

              <Link
                href={`/request?seller=${encodeURIComponent(trip.seller_name)}&country=${encodeURIComponent(trip.country)}`}
                className="mt-6 w-full py-3 bg-white hover:bg-emerald-50 text-brand-green border border-emerald-300 text-center rounded-xl text-sm font-bold transition-all shadow-xs inline-block active:scale-95 cursor-pointer"
              >
                Request ke Seller Ini →
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
