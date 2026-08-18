"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchBuyerRequestById,
  fetchLatestPayment,
  verifyPayment,
} from "@/lib/services/data-service";
import { BuyerRequest } from "@/types/buyer";
import { ArrowLeft, CheckCircle2, AlertCircle, ShieldAlert, Loader2, XCircle } from "lucide-react";
import { updateRequestStatusAction } from "@/app/actions/email";

export default function AdminPaymentVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [payment, setPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const reqData = await fetchBuyerRequestById(requestId);
        if (!reqData) {
          setError("Request tidak ditemukan.");
          return;
        }
        setRequest(reqData);

        const payData = await fetchLatestPayment(requestId);
        if (!payData) {
          setError("Data bukti pembayaran tidak ditemukan.");
          return;
        }
        setPayment(payData);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    }

    if (requestId) {
      loadData();
    }
  }, [requestId]);

  const handleVerify = async (action: "approve" | "reject") => {
    if (action === "reject" && !rejectionReason.trim()) {
      alert("Harap masukkan alasan penolakan.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyPayment(requestId, payment.id, action, rejectionReason);
      if (res.success) {
        // Send email notification based on status
        const emailStatus = action === "approve" ? "paid" : "payment_rejected";
        
        // Also update request status in the database with action to trigger emails
        await updateRequestStatusAction(requestId, emailStatus, {
          rejection_reason: action === "reject" ? rejectionReason : null
        });

        alert(
          action === "approve"
            ? "Pembayaran berhasil disetujui!"
            : "Pembayaran berhasil ditolak."
        );
        router.push("/admin");
        router.refresh();
      } else {
        alert(res.error || "Gagal memproses verifikasi.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin text-primary" />
        <p className="text-body-sm font-semibold text-muted-foreground">Memuat data verifikasi pembayaran...</p>
      </div>
    );
  }

  if (error || !request || !payment) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-negative mx-auto" />
        <h1 className="text-display-xs font-bold text-foreground">Kesalahan Verifikasi</h1>
        <p className="text-body-md text-muted-foreground">{error || "Data tidak lengkap."}</p>
        <Link href="/admin" className="inline-flex items-center button-secondary px-6 py-2.5 rounded-full">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Admin Panel
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xs p-8 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <div className="flex flex-col space-y-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-body-sm-strong text-muted-foreground hover:text-foreground transition-colors gap-1.5 mb-2"
            >
              <ArrowLeft className="h-5 w-5 mr-1" /> Kembali ke Panel Admin
            </Link>
            <h1 className="text-3xl font-extrabold text-ink dark:text-white tracking-tight">Verifikasi Pembayaran</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
              Verifikasi transfer dana dari buyer untuk memvalidasi pembayaran request titipan.
            </p>
          </div>

          <div className="h-px bg-zinc-200/85 dark:bg-zinc-800" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Detail Pembayaran */}
            <div className="card-content p-6 sm:p-8 border border-canvas-soft/85 shadow-md space-y-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl">
              <div className="border-b border-border/10 pb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wider">
                  Menunggu Persetujuan
                </span>
                <h2 className="text-display-xs font-extrabold text-foreground mt-2">Detail Transaksi</h2>
                <p className="text-muted-foreground text-caption mt-1">ID Request: {request.id}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Barang Yang Diminta</label>
                  <p className="text-body-md font-bold text-foreground mt-0.5">{request.item_name} (x{request.quantity})</p>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Total Pembayaran</label>
                  <p className="text-display-xs font-extrabold text-positive-deep dark:text-wise-green mt-0.5">
                    Rp {payment.amount ? Number(payment.amount).toLocaleString("id-ID") : "0"}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Rekening Bank Pengirim</label>
                  <p className="text-body-md font-semibold text-foreground mt-0.5">{payment.bank_account}</p>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Tanggal Kirim</label>
                  <p className="text-body-sm text-muted-foreground mt-0.5">
                    {new Date(payment.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-border/10 space-y-4">
                {!showRejectForm ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleVerify("approve")}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-bold bg-wise-green hover:bg-wise-green-active text-ink transition-colors cursor-pointer border-none shadow-xs disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      Setujui Pembayaran
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowRejectForm(true)}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-bold bg-negative/10 text-negative hover:bg-negative/20 transition-colors cursor-pointer border border-negative/20 shadow-xs disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      Tolak Pembayaran
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="text-caption font-bold text-foreground">Alasan Penolakan</label>
                      <textarea
                        rows={3}
                        placeholder="Contoh: Bukti transfer terpotong, nominal transfer tidak sesuai, dsb..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full mt-1.5 p-3.5 bg-muted/20 border border-border/10 rounded-xl focus:border-foreground/30 focus:outline-none transition-colors text-body-sm text-foreground resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleVerify("reject")}
                        className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-bold bg-negative text-white hover:bg-negative-deep transition-colors cursor-pointer border-none shadow-xs disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        Kirim Penolakan
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason("");
                        }}
                        className="px-6 rounded-full font-bold bg-muted text-muted-foreground hover:bg-muted/70 transition-colors cursor-pointer border border-border/10"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gambar Bukti Pembayaran */}
            <div className="card-content p-6 sm:p-8 border border-canvas-soft/85 shadow-md flex flex-col space-y-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Bukti Transfer (Image Proof)</label>
                <p className="text-body-xs text-muted-foreground mt-0.5">Tinjau gambar secara teliti untuk memastikan transfer valid.</p>
              </div>
              <div className="flex-1 min-h-[350px] bg-muted/10 border border-border/10 rounded-xl overflow-hidden flex items-center justify-center p-2 relative group hover:border-foreground/20 transition-all bg-zinc-100 dark:bg-zinc-800/40">
                {payment.proof_url ? (
                  <img
                    src={payment.proof_url}
                    alt="Bukti Transfer Pembayaran"
                    className="max-h-[480px] object-contain rounded-lg transition-transform group-hover:scale-[1.01]"
                  />
                ) : (
                  <div className="text-center text-muted-foreground p-6 space-y-2">
                    <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
                    <p className="text-body-sm font-semibold">Bukti gambar tidak tersedia.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
