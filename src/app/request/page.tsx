"use client";

import { useState, ChangeEvent, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createBuyerRequest, uploadToStorage, fetchSellerTrips } from "@/lib/services/data-service";
import { SellerTrip } from "@/types/database";

function RequestFormContent() {
  const searchParams = useSearchParams();
  const initialSeller = searchParams.get("seller") || "";
  const initialCountry = searchParams.get("country") || "";

  const [sellerTrips, setSellerTrips] = useState<SellerTrip[]>([]);
  const [formData, setFormData] = useState({
    model: "",
    merk: "",
    kuantitas: 1,
    seller_name: initialSeller,
    country: initialCountry,
    alamat: "",
    price: 0,
    shipping_fee: 35000,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<string>("");

  useEffect(() => {
    async function loadTrips() {
      const trips = await fetchSellerTrips();
      setSellerTrips(trips);
      if (!formData.seller_name && trips.length > 0) {
        setFormData((prev) => ({
          ...prev,
          seller_name: initialSeller || trips[0].seller_name,
          country: initialCountry || trips[0].country,
        }));
      }
    }
    loadTrips();
  }, [initialSeller, initialCountry]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSellerSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedSeller = e.target.value;
    const matchedTrip = sellerTrips.find((t) => t.seller_name === selectedSeller);
    setFormData((prev) => ({
      ...prev,
      seller_name: selectedSeller,
      country: matchedTrip ? matchedTrip.country : prev.country,
    }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.model || !formData.merk || !formData.alamat) {
      alert("Mohon lengkapi semua field yang berbintang wajib (*).");
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadToStorage(photoFile, "request-photos");
      }

      const created = await createBuyerRequest({
        model: formData.model,
        merk: formData.merk,
        kuantitas: Number(formData.kuantitas) || 1,
        seller_name: formData.seller_name || "Budi (Jasa Titip JP)",
        country: formData.country || "🇯🇵 Jepang",
        alamat: formData.alamat,
        photo_url: photoUrl,
        price: Number(formData.price) || 0,
        shipping_fee: Number(formData.shipping_fee) || 35000,
      });

      setSubmittedId(created.id);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Submit request error:", err);
      alert("Terjadi kesalahan saat mengirim request. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-3 py-1 rounded-full border border-emerald-200">
            Form Titipan Luar Negeri
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-2">
            Buat Request Barang
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Isi rincian barang yang ingin kamu titip beli kepada traveler.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-slate-500 hover:text-brand-green transition-colors hidden sm:inline-flex items-center gap-1"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>

      {isSubmitted ? (
        <div className="text-center py-12 px-4 space-y-6 bg-brand-green-light/80 border border-emerald-200 rounded-3xl animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-brand-green text-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg ring-8 ring-emerald-100">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Request Berhasil Terkirim! 🚀
            </h2>
            <p className="text-sm text-slate-600 font-mono">
              ID Request: <span className="font-bold text-slate-900">{submittedId}</span>
            </p>
          </div>
          <p className="text-slate-700 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Request barang titipan kamu telah diteruskan ke seller{" "}
            <span className="font-bold text-slate-900">{formData.seller_name}</span>. Silakan pantau status konfirmasi harga seller secara berkala di dashboard.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-green hover:bg-[#43A047] text-white font-bold rounded-2xl transition-all shadow-md text-base active:scale-95 cursor-pointer"
            >
              Kembali ke Dashboard
            </Link>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  model: "",
                  merk: "",
                  kuantitas: 1,
                  seller_name: initialSeller || (sellerTrips[0]?.seller_name ?? ""),
                  country: initialCountry || (sellerTrips[0]?.country ?? ""),
                  alamat: "",
                  price: 0,
                  shipping_fee: 35000,
                });
                setPhotoFile(null);
                setPreviewUrl(null);
              }}
              className="inline-flex items-center justify-center px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold rounded-2xl transition-all shadow-xs text-base cursor-pointer"
            >
              + Buat Request Lainnya
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Seller & Negara */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilih Seller / Traveler <span className="text-rose-500">*</span>
              </label>
              <select
                name="seller_name"
                value={formData.seller_name}
                onChange={handleSellerSelect}
                className="w-full bg-white border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                required
              >
                {sellerTrips.length > 0 ? (
                  sellerTrips.map((trip) => (
                    <option key={trip.id} value={trip.seller_name}>
                      {trip.seller_name} ({trip.country})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Budi Santoso">Budi Santoso (🇯🇵 Jepang)</option>
                    <option value="Siti Rahma">Siti Rahma (🇸🇬 Singapura)</option>
                    <option value="Andi Wijaya">Andi Wijaya (🇰🇷 Korea Selatan)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Negara Asal Pembelian <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Contoh: 🇯🇵 Jepang"
                required
                className="w-full bg-white border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Model & Merk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Model / Nama Barang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                required
                placeholder="Contoh: PlayStation 5 Slim Digital"
                value={formData.model}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl px-4 py-3 text-slate-950 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Merk / Brand <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="merk"
                required
                placeholder="Contoh: Sony"
                value={formData.merk}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl px-4 py-3 text-slate-950 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Kuantitas & Upload Foto Referensi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Kuantitas <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="kuantitas"
                min="1"
                required
                value={formData.kuantitas}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl px-4 py-3 text-slate-950 focus:outline-none transition-all font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Foto Referensi Barang (Opsional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-green-light file:text-brand-green cursor-pointer border border-slate-300 rounded-xl bg-slate-50 p-1"
              />
              {previewUrl && (
                <div className="mt-3 p-3 bg-brand-green-light/40 border border-emerald-200 rounded-2xl flex items-center gap-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Preview Foto Terpilih</p>
                    <p className="text-xs text-slate-500">{photoFile?.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alamat Pengiriman */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Alamat Lengkap Pengiriman Buyer <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="alamat"
              rows={3}
              required
              placeholder="Contoh: Jl. Mawar No. 12, RT 01/RW 02, Kebayoran Baru, Jakarta Selatan, 12110"
              value={formData.alamat}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl px-4 py-3 text-slate-950 placeholder-slate-400 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand-green hover:bg-[#43A047] font-bold rounded-2xl text-white transition-all shadow-md active:scale-95 cursor-pointer text-base sm:text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengirim Request ke Seller...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Kirim Request ke Seller</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function RequestPage() {
  return (
    <div className="min-h-screen bg-[#e9ebe6] text-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 flex justify-center items-center p-4 sm:p-8 md:p-12">
        <Suspense fallback={<div className="text-slate-500">Memuat formulir...</div>}>
          <RequestFormContent />
        </Suspense>
      </main>
    </div>
  );
}
