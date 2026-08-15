"use client";

import { useState, ChangeEvent, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  fetchBuyerRequestById,
  submitBuyerPayment,
} from "@/lib/services/data-service";
import { BuyerRequest } from "@/types/buyer";

function PaymentContent() {
  const searchParams = useSearchParams();
  const reqId = searchParams.get("id") || "REQ-001";

  const [item, setItem] = useState<BuyerRequest | null>(null);
  const [bankAccount, setBankAccount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchBuyerRequestById(reqId);
        setItem(data);
      } catch (e) {
        console.error("Load payment req error:", e);
      }
    }
    load();
  }, [reqId]);

  const price = item?.price || 265000;
  const fee = item?.fee || Math.round(price * 0.1);
  const shippingFee = item?.shipping_fee || 20000;
  const totalPayment = price + fee + shippingFee;

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!bankAccount) {
      alert("Mohon isi nomor rekening bank pengirim.");
      return;
    }
    if (!proofFile) {
      alert("Mohon unggah bukti transfer/transaksi terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitBuyerPayment({
        request_id: item?.id || reqId,
        bank_account: bankAccount,
        proof_file: proofFile,
        amount: totalPayment,
      });

      setIsPaid(true);
    } catch (err) {
      console.error("Submit payment error:", err);
      alert("Gagal mengirim pembayaran. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-3 py-1 rounded-full border border-emerald-200">
            {isPaid ? "Status Pembayaran" : "Instruksi Transfer"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-2">
            {isPaid ? "Pembayaran Diterima" : "Form Pembayaran Buyer"}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            {isPaid
              ? "Bukti pembayaran telah berhasil dikirim dan diverifikasi sistem."
              : "Selesaikan transfer dan unggah bukti transaksi untuk memproses pesanan."}
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-slate-500 hover:text-brand-green transition-colors hidden sm:inline-flex items-center gap-1"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>

      {!isPaid ? (
        /* FASE 1: FORM PEMBAYARAN */
        <form onSubmit={handleSubmitPayment} className="space-y-6">
          {/* Informasi Rekening Tujuan Seller */}
          <div className="p-6 bg-brand-green-light/80 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-brand-green uppercase tracking-wider">
                Rekening Bank Tujuan (Seller Jastip)
              </p>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-slate-700">
                {item?.id || reqId}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-1">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-wide font-mono">
                  BCA - 8820 1923 881
                </p>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  a.n. <span className="text-slate-900 font-semibold">{item?.seller_name || "Budi Santoso"}</span> (Jastip Seller)
                </p>
              </div>
              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-200">
                <p className="text-xs text-slate-500 font-medium">Total Transfer Pas</p>
                <p className="text-2xl font-extrabold text-brand-green">
                  {formatRupiah(totalPayment)}
                </p>
              </div>
            </div>
          </div>

          {/* Rincian Item Ringkas */}
          {item && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-900">{item.model}</span> ({item.merk}) x{item.kuantitas}
              </div>
              <div className="text-right font-medium">
                {item.country}
              </div>
            </div>
          )}

          {/* Input Nomor Rekening Buyer */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Nomor Rekening Bank & Nama Pengirim (Buyer) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Mandiri - 1370012345678 a.n Ahmad"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl px-4 py-3 text-slate-950 placeholder-slate-400 focus:outline-none transition-all font-medium text-sm sm:text-base"
            />
          </div>

          {/* Unggah Bukti Transaksi */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Unggah Bukti Transfer / Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-green-light file:text-brand-green cursor-pointer border border-slate-300 rounded-xl bg-slate-50 p-1"
            />
            {previewUrl && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                <img
                  src={previewUrl}
                  alt="Bukti Transfer"
                  className="w-20 h-20 object-cover rounded-xl border border-slate-300 shrink-0 shadow-xs"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">Bukti Transfer Terlampir</p>
                  <p className="text-xs text-slate-500 mt-0.5">{proofFile?.name}</p>
                  <span className="inline-block mt-1 text-[11px] font-bold text-brand-green bg-brand-green-light px-2 py-0.5 rounded-md">
                    Siap Dikirim
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tombol Submit Pembayaran */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand-green hover:bg-[#43A047] font-bold rounded-2xl text-white transition-all shadow-md active:scale-95 cursor-pointer text-base sm:text-lg tracking-tight flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengunggah Bukti Pembayaran...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Kirim Bukti Pembayaran</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* FASE 2: STATUS PESANAN SUKSES */
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          
          {/* Banner Sukses Pembayaran */}
          <div className="p-6 bg-brand-green-light/80 border border-emerald-200 rounded-3xl flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-950">
                Bukti Pembayaran Berhasil Dikirim!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Rekening Pengirim: <span className="font-bold text-slate-900">{bankAccount}</span>
              </p>
              <p className="text-xs text-brand-green font-semibold">
                Nominal: {formatRupiah(totalPayment)}
              </p>
            </div>
          </div>

          {/* Rincian Keterangan Status saat ini */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Detail Status Terakhir
            </p>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Pesanan Sedang Diproses Seller
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Admin akan memverifikasi pembayaran Anda dan seller segera membelikan barang titipan Anda di luar negeri.
              </p>
            </div>
          </div>

          {/* Tombol aksi */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/tracking?id=${encodeURIComponent(item?.id || reqId)}`}
              className="flex-1 py-3.5 bg-brand-green hover:bg-[#43A047] text-white font-bold text-center rounded-2xl text-sm transition-all shadow-md active:scale-95"
            >
              📦 Lacak Pesanan Sekarang
            </Link>
            <Link
              href="/"
              className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-center rounded-2xl text-sm transition-all shadow-sm active:scale-95"
            >
              Kembali ke Dashboard
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">Memuat pembayaran...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
