"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { BuyerRequest } from "@/types/buyer";
import { fetchBuyerRequestById, updateRequestStatus } from "@/lib/services/data-service";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reqId = searchParams.get("id") || "REQ-001";

  const [item, setItem] = useState<BuyerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      try {
        const data = await fetchBuyerRequestById(reqId);
        setItem(data);
      } catch (e) {
        console.error("Load item error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [reqId]);

  const handleConfirmCancel = async () => {
    if (!item) return;

    setCancelling(true);
    try {
      await updateRequestStatus(item.id, "cancelled");
      router.push("/dashboard");
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
      <div className="card-content text-center text-muted-foreground max-w-xl mx-auto border border-canvas-soft/85 shadow-lg p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-body-sm-strong">Memuat rincian konfirmasi...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="card-content text-center text-foreground max-w-xl mx-auto border border-canvas-soft/85 shadow-lg p-8 space-y-4">
        <h2 className="text-display-xs font-bold">Request Tidak Ditemukan</h2>
        <p className="text-body-sm text-muted-foreground">ID request tidak valid atau telah dihapus.</p>
        <Link
          href="/dashboard"
          className="button-primary text-sm font-semibold"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const price = (item.status !== "pending" && item.agreed_price != null)
    ? item.agreed_price
    : (item.estimated_price || 0);
  const quantityVal = item.quantity || 1;
  const itemTotalPrice = price * quantityVal;
  const fee = item.jastip_fee != null ? item.jastip_fee : Math.round(itemTotalPrice * 0.1);
  const shippingFee = item.shipping_fee || 0;
  const totalDibayar = item.total_price || (itemTotalPrice + fee + shippingFee);

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* Tombol Kembali */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-body-sm-strong text-muted-foreground hover:text-foreground transition-colors gap-1.5"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Kembali ke Dashboard
      </Link>

      {/* Card Utama Konfirmasi */}
      <div className="card-content border border-canvas-soft/85 shadow-lg sm:p-10 space-y-6">

        {/* Header Card */}
        <div className="border-b border-border/10 pb-5">
          <div className="inline-flex items-center gap-2 badge-positive mb-2">
            Penawaran Harga Seller
          </div>
          <h1 className="text-display-xs sm:text-display-sm font-extrabold text-foreground tracking-tight">
            Konfirmasi Harga & Pembayaran
          </h1>
          <p className="text-muted-foreground text-body-sm sm:text-body-md mt-1">
            Seller telah mengajukan harga barang titipan. Periksa rincian tagihan di bawah sebelum melakukan konfirmasi pembayaran.
          </p>
        </div>

        {/* Informasi Barang */}
        <div className="flex items-start gap-4 sm:gap-5 card-feature-sage border border-canvas-soft/85">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-canvas-soft/60 rounded-xl flex items-center justify-center text-muted-foreground font-mono text-xs shrink-0 overflow-hidden border border-canvas-soft">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.item_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>IMG</span>
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-body-lg font-bold text-foreground">
              {item.item_name}
            </h2>
            <p className="text-body-sm text-muted-foreground">
              Kuantitas: <span className="font-semibold text-foreground">{item.quantity}</span>
            </p>
            <p className="text-caption text-muted-foreground mt-1">
              Seller: <span className="font-bold text-foreground">{item.seller_name}</span> ({item.country})
            </p>
            <p className="text-caption font-mono text-muted-foreground/60">ID: {item.id}</p>
          </div>
        </div>

        {/* Kartu Estimasi Tagihan */}
        <div className="card-feature-sage border border-canvas-soft/85 p-6 space-y-3.5">
          <h3 className="font-bold text-foreground text-body-md-strong mb-3">
            Rincian Tagihan Resmi
          </h3>

          <div className="flex justify-between text-body-sm text-muted-foreground">
            <span>Harga Barang Asli {quantityVal > 1 ? `(${quantityVal}x Rp ${price.toLocaleString("id-ID")})` : ""}</span>
            <span className="font-semibold text-foreground">{formatRupiah(itemTotalPrice)}</span>
          </div>

          <div className="flex justify-between text-body-sm text-muted-foreground">
            <span>Fee Jastip</span>
            <span className="font-semibold text-foreground">{formatRupiah(fee)}</span>
          </div>

          <div className="flex justify-between text-body-sm text-muted-foreground">
            <span>Ongkos Kirim Domestik</span>
            <span className="font-semibold text-foreground">{formatRupiah(shippingFee)}</span>
          </div>

          {/* Garis Putus-Putus */}
          <hr className="border-t border-dashed border-border/20 my-4" />

          <div className="flex justify-between items-center pt-1">
            <div>
              <span className="text-foreground font-bold text-body-sm-strong">Total Yang Harus Dibayar</span>
              <p className="text-caption text-muted-foreground">Termasuk fee & ongkir</p>
            </div>
            <span className="text-display-xs sm:text-display-sm font-extrabold text-foreground tracking-tight">
              {formatRupiah(totalDibayar)}
            </span>
          </div>
        </div>

        {/* Tombol Aksi: Cancel Request & Konfirmasi Pembayaran */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3">
          <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <button
              type="button"
              onClick={() => setIsCancelDialogOpen(true)}
              disabled={cancelling}
              className="w-full sm:w-auto button-tertiary text-sm py-3 px-6 cursor-pointer text-center text-negative border-negative hover:bg-negative/10 dark:hover:bg-negative/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <X className="h-5 w-5 mr-2" /> Batalkan Request (Harga Tidak Sesuai)
            </button>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Batalkan Request?</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin membatalkan request ini karena harga tidak sesuai? Tindakan ini akan membatalkan pesanan secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmCancel}>
                  Ya, Batalkan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Link
            href={`/payment?id=${encodeURIComponent(item.id)}`}
            className="button-primary w-full sm:w-auto justify-center transition-all active:scale-95"
          >
            <Check className="h-5 w-5 mr-2" /> Konfirmasi & Bayar Sekarang
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">Memuat data...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
