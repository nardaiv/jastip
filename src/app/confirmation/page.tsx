"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  fetchBuyerRequestById,
  updateRequestStatus,
  INITIAL_BUYER_REQUESTS,
} from "@/lib/services/data-service";
import { BuyerRequest } from "@/types/database";

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reqId = searchParams.get("id") || "REQ-001";

  const [item, setItem] = useState<BuyerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      try {
        const data = await fetchBuyerRequestById(reqId);
        if (data) {
          setItem(data);
        } else {
          // Fallback to initial mock item
          const fallback =
            INITIAL_BUYER_REQUESTS.find((r) => r.id === reqId) ||
            INITIAL_BUYER_REQUESTS[1];
          setItem(fallback);
        }
      } catch (e) {
        console.error("Load item error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [reqId]);

  const handleCancel = async () => {
    if (!item) return;
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin membatalkan request ini karena harga tidak sesuai?"
    );
    if (!isConfirmed) return;

    setCancelling(true);
    try {
      await updateRequestStatus(item.id, "cancelled");
      router.push("/");
    } catch (e) {
      console.error("Cancel error:", e);
      setCancelling(false);
    }
  };

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
        <p className="text-sm font-semibold">Memuat rincian konfirmasi...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center text-slate-700 max-w-xl mx-auto shadow-md space-y-4">
        <h2 className="text-xl font-bold">Request Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">ID request tidak valid atau telah dihapus.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-brand-green text-white font-bold rounded-xl text-sm"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const price = item.price || 265000;
  const fee = item.fee || Math.round(price * 0.1);
  const shippingFee = item.shipping_fee || 20000;
  const totalDibayar = price + fee + shippingFee;

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* Tombol Kembali */}
      <Link
        href="/"
        className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors gap-1.5"
      >
        ← Kembali ke Dashboard
      </Link>

      {/* Card Utama Konfirmasi */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200/90 space-y-6">
        
        {/* Header Card */}
        <div className="border-b border-slate-100 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green-light text-brand-green text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
            Penawaran Harga Seller
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Konfirmasi Harga & Pembayaran
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Seller telah mengajukan harga barang titipan. Periksa rincian tagihan di bawah sebelum melakukan konfirmasi pembayaran.
          </p>
        </div>

        {/* Informasi Barang */}
        <div className="flex items-start gap-4 sm:gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-mono text-xs shrink-0 overflow-hidden">
            {item.photo_url ? (
              <img
                src={item.photo_url}
                alt={item.model}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>IMG</span>
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-950">
              {item.model}
            </h2>
            <p className="text-sm text-slate-600">
              Merk: <span className="font-semibold text-slate-900">{item.merk}</span> • Kuantitas:{" "}
              <span className="font-semibold text-slate-900">{item.kuantitas}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Seller: <span className="font-bold text-slate-800">{item.seller_name}</span> ({item.country})
            </p>
            <p className="text-xs font-mono text-slate-400">ID: {item.id}</p>
          </div>
        </div>

        {/* Kartu Estimasi Tagihan */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3.5">
          <h3 className="font-bold text-slate-950 text-base mb-3">
            Rincian Tagihan Resmi
          </h3>

          <div className="flex justify-between text-sm text-slate-600">
            <span>Harga Barang Asli</span>
            <span className="font-semibold text-slate-900">{formatRupiah(price)}</span>
          </div>

          <div className="flex justify-between text-sm text-slate-600">
            <span>Fee Jastip (10%)</span>
            <span className="font-semibold text-slate-900">{formatRupiah(fee)}</span>
          </div>

          <div className="flex justify-between text-sm text-slate-600">
            <span>Ongkos Kirim Domestik</span>
            <span className="font-semibold text-slate-900">{formatRupiah(shippingFee)}</span>
          </div>

          {/* Garis Putus-Putus */}
          <hr className="border-t-2 border-dashed border-slate-300 my-4" />

          <div className="flex justify-between items-center pt-1">
            <div>
              <span className="text-slate-700 font-bold text-sm">Total Yang Harus Dibayar</span>
              <p className="text-xs text-slate-500">Termasuk fee & ongkir</p>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-green tracking-tight">
              {formatRupiah(totalDibayar)}
            </span>
          </div>
        </div>

        {/* Tombol Aksi: Cancel Request & Konfirmasi Pembayaran */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full sm:w-auto px-6 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-xl text-sm transition-all active:scale-95 text-center cursor-pointer disabled:opacity-50"
          >
            {cancelling ? "Membatalkan..." : "✕ Batalkan Request (Harga Tidak Sesuai)"}
          </button>

          <Link
            href={`/payment?id=${encodeURIComponent(item.id)}`}
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-green hover:bg-[#43A047] font-bold text-white rounded-xl text-sm shadow-md transition-all active:scale-95 text-center cursor-pointer block"
          >
            ✓ Konfirmasi & Bayar Sekarang
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-[#e9ebe6] text-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 sm:p-8 md:p-10 flex justify-center items-center">
        <Suspense fallback={<div className="text-slate-500">Memuat data...</div>}>
          <ConfirmationContent />
        </Suspense>
      </main>
    </div>
  );
}
