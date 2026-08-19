"use client";

import { useState, ChangeEvent, FormEvent, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  fetchBuyerRequestById,
  submitBuyerPayment,
} from "@/lib/services/data-service";
import { BuyerRequest } from "@/types/buyer";
import { ArrowLeft, Check, Package, UploadCloud, X } from "lucide-react";

function PaymentContent() {
  const searchParams = useSearchParams();
  const reqId = searchParams.get("id") || "REQ-001";

  const [item, setItem] = useState<BuyerRequest | null>(null);
  const [bankAccount, setBankAccount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const price = (item?.status !== "pending" && item?.agreed_price != null)
    ? item.agreed_price
    : (item?.estimated_price || 0);
  const quantityVal = item?.quantity || 1;
  const itemTotalPrice = price * quantityVal;
  const fee = item?.jastip_fee != null ? item.jastip_fee : Math.round(itemTotalPrice * 0.1);
  const shippingFee = item?.shipping_fee || 0;
  const totalPayment = item?.total_price || (itemTotalPrice + fee + shippingFee);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Tipe file tidak valid. Harap unggah file gambar saja.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file melebihi batas 5 MB.");
      return;
    }
    setProofFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
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
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* Tombol Kembali */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-body-sm-strong text-muted-foreground hover:text-foreground transition-colors gap-1.5"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Kembali ke Dashboard
      </Link>

      {/* Card Utama Pembayaran */}
      <div className="card-content border border-canvas-soft/85 shadow-lg sm:p-10 space-y-6">
        {/* Header */}
        <div className="border-b border-border/10 pb-5">
          <div className="inline-flex items-center gap-2 badge-positive mb-2">
            {isPaid ? "Status Pembayaran" : "Instruksi Transfer"}
          </div>
          <h1 className="text-display-xs sm:text-display-sm font-extrabold text-foreground tracking-tight">
            {isPaid ? "Pembayaran Diterima" : "Form Pembayaran Buyer"}
          </h1>
          <p className="text-muted-foreground text-body-sm sm:text-body-md mt-1">
            {isPaid
              ? "Bukti pembayaran telah berhasil dikirim dan diverifikasi sistem."
              : "Selesaikan transfer dan unggah bukti transaksi untuk memproses pesanan."}
          </p>
        </div>

        {!isPaid ? (
          /* FASE 1: FORM PEMBAYARAN */
          <form onSubmit={handleSubmitPayment} className="space-y-6">
            {/* Informasi Rekening Tujuan Seller */}
            <div className="card-feature-green border border-canvas-soft/85 space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-caption font-bold text-positive-deep uppercase tracking-wider">
                  Rekening Bank Tujuan (Admin Jastip)
                </p>
                <span className="text-caption font-mono px-2 py-0.5 rounded-md bg-canvas border border-canvas-soft text-foreground">
                  {item?.id || reqId}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-1">
                <div>
                  <p className="text-display-xs font-extrabold text-foreground tracking-wide font-mono">
                    Mandiri - 1370 0998 87766
                  </p>
                  <p className="text-caption sm:text-body-sm text-body">
                    a.n. <span className="text-foreground font-semibold">PT Jastip Nusantara</span> (Admin Jastip)
                  </p>
                </div>
                <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-border/10">
                  <p className="text-caption text-body font-medium">Total Transfer Pas</p>
                  <p className="text-display-xs font-extrabold text-positive-deep">
                    {formatRupiah(totalPayment)}
                  </p>
                </div>
              </div>
            </div>

            {/* Rincian Item Ringkas */}
            {item && (
              <div className="card-feature-sage border border-canvas-soft/85 flex items-center justify-between text-body-sm text-body py-4 px-6">
                <div>
                  <span className="font-bold text-foreground">{item.item_name}</span> x{item.quantity}
                </div>
                <div className="text-right font-semibold text-muted-foreground">
                  {item.country}
                </div>
              </div>
            )}

            {/* Input Nomor Rekening Buyer */}
            <div>
              <label className="block text-body-sm-strong text-foreground mb-1.5">
                Nomor Rekening Bank & Nama Pengirim (Buyer) <span className="text-negative">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Mandiri - 1370012345678 a.n Ahmad"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full bg-canvas-soft/50 border border-border/10 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none transition-all font-medium text-body-sm sm:text-body-md"
              />
            </div>

            {/* Unggah Bukti Transaksi */}
            <div>
              <label className="block text-body-sm-strong text-foreground mb-2">
                Unggah Bukti Transfer / Transaksi <span className="text-negative">*</span>
              </label>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center min-h-[180px] p-6 text-center border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer select-none group
                  ${isDragActive
                    ? "border-primary bg-primary/10 scale-[1.01] shadow-inner"
                    : "border-border/15 bg-canvas-soft/30 hover:bg-canvas-soft/60 hover:border-primary/50"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="w-full flex flex-col items-center gap-3">
                    <div className="relative group/preview w-28 h-28 rounded-xl overflow-hidden border border-border/10 shadow-md">
                      <img
                        src={previewUrl}
                        alt="Bukti Transfer Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProofFile(null);
                            setPreviewUrl(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="p-1.5 bg-negative hover:bg-negative-deep text-white rounded-full transition-colors"
                          title="Hapus gambar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-body-sm-strong text-foreground line-clamp-1">{proofFile?.name}</p>
                      <p className="text-caption text-muted-foreground mt-0.5">
                        {(proofFile?.size && (proofFile.size / 1024 / 1024).toFixed(2)) || "0.00"} MB
                      </p>
                      <span className="inline-block mt-2 badge-positive text-xs">
                        Siap Dikirim (Klik/Drop untuk mengganti)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-full bg-canvas-soft border border-border/5 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors
                      ${isDragActive ? "bg-primary/20 border-primary/30" : ""}`}>
                      <UploadCloud className={`h-8 w-8 text-muted-foreground transition-colors duration-200 group-hover:text-primary-foreground
                        ${isDragActive ? "text-primary-foreground" : ""}`} />
                    </div>
                    <div>
                      <p className="text-body-md font-bold text-foreground">
                        Tarik & lepas bukti transfer di sini
                      </p>
                      <p className="text-body-sm text-muted-foreground mt-1">
                        atau klik untuk memilih file dari perangkat Anda
                      </p>
                    </div>
                    <p className="text-caption text-muted-foreground mt-1 bg-canvas px-3 py-1 rounded-full border border-border/5">
                      Hanya file gambar (JPG, PNG, WEBP, GIF), Maks. 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Submit Pembayaran */}
            <div className="pt-4 border-t border-border/10">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full button-primary transition-all active:scale-95 disabled:opacity-50 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    <span>Mengunggah Bukti Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
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
            <div className="card-feature-green border border-canvas-soft/85 flex items-start gap-4 p-6">
              <div className="w-12 h-12 bg-positive text-canvas rounded-full flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
                <Check />
              </div>
              <div className="space-y-1">
                <h3 className="text-body-lg font-bold text-foreground">
                  Bukti Pembayaran Berhasil Dikirim!
                </h3>
                <p className="text-body-sm text-body">
                  Rekening Pengirim: <span className="font-bold text-foreground">{bankAccount}</span>
                </p>
                <p className="text-body-sm text-positive-deep font-semibold">
                  Nominal: {formatRupiah(totalPayment)}
                </p>
              </div>
            </div>

            {/* Rincian Keterangan Status saat ini */}
            <div className="card-feature-sage border border-canvas-soft/85 space-y-3 p-6">
              <p className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                Detail Status Terakhir
              </p>
              <div>
                <h4 className="text-body-md-strong font-bold text-foreground">
                  Pesanan Sedang Diproses Seller
                </h4>
                <p className="text-body-sm text-body mt-1 leading-relaxed">
                  Admin akan memverifikasi pembayaran Anda dan seller segera membelikan barang titipan Anda di luar negeri.
                </p>
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard"
                className="flex-1 button-secondary text-center transition-all active:scale-95"
              >
                Kembali ke Dashboard
              </Link>
            </div>

          </div>
        )}
      </div>
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
