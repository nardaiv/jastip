"use client";

import { useState, ChangeEvent, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  createBuyerRequest,
  uploadToStorage,
  fetchTripById,
  fetchUserShippingAddresses,
} from "@/lib/services/data-service";
import { SellerTrip } from "@/types/buyer";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Phone, PlaneTakeoff, PlaneLanding, Plane, AlertTriangle, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

function RequestFormContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get("trip_id") || "";

  const [selectedTrip, setSelectedTrip] = useState<SellerTrip | null>(null);
  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const [formData, setFormData] = useState({
    trip_id: tripId,
    item_name: "",
    quantity: 1,
    estimated_price: 0,
    currency: "IDR",
    description: "",
    reference_link: "",
    shipping_address_id: "",
    weight_value: 0,
    weight_unit: "KG",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      if (!tripId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [trip, addresses] = await Promise.all([
          fetchTripById(tripId),
          fetchUserShippingAddresses(),
        ]);

        if (trip) {
          setSelectedTrip(trip);
          // Pre-select default address if exists
          const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
          const initialAddrId = defaultAddr?.id || "";

          setShippingAddresses(addresses);
          setFormData((prev) => ({
            ...prev,
            trip_id: tripId,
            shipping_address_id: initialAddrId,
            currency: trip.country?.includes("Jepang") || trip.country?.includes("Japan")
              ? "JPY"
              : trip.country?.includes("Singapura") || trip.country?.includes("Singapore")
                ? "SGD"
                : trip.country?.includes("Korea")
                  ? "KRW"
                  : "IDR",
          }));
        }
      } catch (err) {
        console.error("Error loading request form data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [tripId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showAlert("Format File Salah", "Harap pilih file gambar saja (JPG, PNG, WebP, dll.).");
        e.target.value = "";
        setPhotoFile(null);
        setPreviewUrl(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert("Ukuran File Terlalu Besar", "Ukuran file tidak boleh melebihi 5 MB.");
        e.target.value = "";
        setPhotoFile(null);
        setPreviewUrl(null);
        return;
      }
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.trip_id || !formData.item_name || !formData.shipping_address_id) {
      showAlert("Data Belum Lengkap", "Mohon lengkapi semua field yang wajib (*).");
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadToStorage(photoFile, "item-requests");
      }

      const created = await createBuyerRequest({
        trip_id: formData.trip_id,
        item_name: formData.item_name,
        description: formData.description || null,
        quantity: Number(formData.quantity) || 1,
        estimated_price: Number(formData.estimated_price) || 0,
        currency: formData.currency || "IDR",
        reference_link: formData.reference_link || null,
        image_url: photoUrl,
        shipping_address_id: formData.shipping_address_id,
        weight_value: formData.weight_value ? Number(formData.weight_value) : null,
        weight_unit: formData.weight_unit || "KG",
      });

      setSubmittedId(created.id);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Submit request error:", err);
      showAlert("Gagal Mengirim Request", "Terjadi kesalahan saat mengirim request. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl text-center py-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-muted-foreground">Memuat detail trip...</p>
      </div>
    );
  }

  // Fallback if trip ID is missing or invalid
  if (!tripId || !selectedTrip) {
    return (
      <Card className="mx-auto w-full max-w-xl text-center [--card-spacing:24px] sm:[--card-spacing:32px] border border-border/15 bg-card rounded-[24px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Trip Tidak Ditentukan</span>
          </CardTitle>
          <CardDescription>
            Silakan pilih traveler trip aktif terlebih dahulu di dashboard untuk membuat request titipan.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex justify-center">
          <Link href="/dashboard" className="button-primary px-6 py-2.5">
            Kembali ke Dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Detail Trip Card (Boarding Pass Theme) */}
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Tombol Kembali */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors gap-1.5"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>
      <Card className="mx-auto w-full max-w-3xl bg-wise-green-pale border border-wise-green-neutral rounded-[24px] overflow-hidden [--card-spacing:20px] sm:[--card-spacing:24px] shadow-sm">
        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-positive-deep bg-white/60 px-2.5 py-1 rounded-full border border-emerald-300">
              Trip Traveler Terpilih
            </span>
            <h2 className="text-2xl font-display font-extrabold text-foreground tracking-tight mt-1.5" title={selectedTrip.title}>
              {selectedTrip.title || `Trip ke ${selectedTrip.country}`}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-body font-medium">
              <p className="flex items-center gap-1.5">
                <span className="text-mute font-semibold">Traveler:</span>
                <span className="text-foreground font-bold">{selectedTrip.seller_name}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-mute font-semibold">Negara Tujuan:</span>
                <span className="text-foreground font-bold">{selectedTrip.country}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <PlaneTakeoff className="h-4 w-4 text-positive-deep" />
                <span>Berangkat: {selectedTrip.departure_date}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <PlaneLanding className="h-4 w-4 text-positive-deep" />
                <span>Tiba Kembali: {selectedTrip.return_date}</span>
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-center bg-white/45 w-16 h-16 rounded-2xl border border-white/70 shadow-xs text-positive-deep">
            <Plane className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>

      {/* Main Request Form Card */}
      <Card className="mx-auto w-full max-w-3xl border border-border/15 shadow-lg bg-card rounded-[24px] [--card-spacing:24px] sm:[--card-spacing:32px]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-positive-deep bg-wise-green-pale px-3 py-1 rounded-full border border-wise-green-neutral">
              Form Titipan Luar Negeri
            </span>
            <CardTitle className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight mt-3">
              Buat Request Barang
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base mt-1">
              Isi rincian barang yang ingin kamu titip beli kepada traveler.
            </CardDescription>
          </div>

        </CardHeader>

        <CardContent className="pt-6">
          {isSubmitted ? (
            <div className="text-center py-12 px-6 space-y-6 bg-wise-green-pale/50 border border-wise-green-neutral rounded-3xl animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto shadow-md ring-8 ring-wise-green-pale">
                <Check className="h-10 w-10 stroke-[3px]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
                  Request Berhasil Terkirim!
                </h2>
                <p className="text-sm text-muted-foreground font-mono">
                  ID Request: <span className="font-bold text-foreground">{submittedId}</span>
                </p>
              </div>
              <p className="text-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Request barang titipan kamu telah diteruskan ke seller{" "}
                <span className="font-bold text-foreground">{selectedTrip.seller_name}</span>. Silakan pantau status konfirmasi harga seller secara berkala di dashboard.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="button-primary text-base px-8 py-3.5"
                >
                  Kembali ke Dashboard
                </Link>
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData((prev) => ({
                      ...prev,
                      item_name: "",
                      quantity: 1,
                      estimated_price: 0,
                      description: "",
                      reference_link: "",
                      weight_value: 0,
                    }));
                    setPhotoFile(null);
                    setPreviewUrl(null);
                  }}
                  className="button-secondary text-base px-6 py-3.5"
                >
                  + Buat Request Lainnya
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Item Name */}
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-1.5">
                  Nama Barang <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  name="item_name"
                  required
                  placeholder="Contoh: PlayStation 5 Slim Digital atau Blue Bottle Coffee Beans"
                  value={formData.item_name}
                  onChange={handleChange}
                  className="w-full h-11 bg-background border border-border/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                />
              </div>

              {/* Kuantitas & Estimasi Harga */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <Label className="block text-sm font-semibold text-foreground mb-1.5">
                    Kuantitas <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="quantity"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full h-11 bg-background border border-border/20 rounded-xl px-4 py-3 text-foreground focus:outline-none transition-all font-semibold"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-semibold text-foreground mb-1.5">
                    Estimasi Harga (Satuan)
                  </Label>
                  <Input
                    type="number"
                    name="estimated_price"
                    min="0"
                    placeholder="Contoh: 75000"
                    value={formData.estimated_price || ""}
                    onChange={handleChange}
                    className="w-full h-11 bg-background border border-border/20 rounded-xl px-4 py-3 text-foreground focus:outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-semibold text-foreground mb-1.5">
                    Mata Uang
                  </Label>
                  {formData.currency && (
                    <Select
                      value={formData.currency}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, currency: val || "IDR" }))}
                    >
                      <SelectTrigger className="w-full h-11 bg-background border border-border/20 rounded-xl px-4">
                        <SelectValue placeholder="Mata Uang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                        <SelectItem value="JPY">JPY (Yen Jepang)</SelectItem>
                        <SelectItem value="SGD">SGD (Dolar Singapura)</SelectItem>
                        <SelectItem value="USD">USD (Dolar AS)</SelectItem>
                        <SelectItem value="KRW">KRW (Won Korea)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Alamat Pengiriman */}
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-1.5">
                  Alamat Pengiriman Buyer <span className="text-destructive">*</span>
                </Label>
                {shippingAddresses.length > 0 ? (
                  formData.shipping_address_id ? (
                    <div className="space-y-3">
                      <Select
                        value={formData.shipping_address_id}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, shipping_address_id: val || "" }))}
                      >
                        <SelectTrigger className="w-full h-11 bg-background border border-border/20 rounded-xl px-4 text-sm text-foreground">
                          <SelectValue placeholder="Pilih Alamat Pengiriman">
                            {(val) => {
                              const addr = shippingAddresses.find((a) => a.id === val);
                              return addr
                                ? `${addr.contact_name} - ${addr.street_line_1}, ${addr.city}`
                                : "Pilih Alamat Pengiriman";
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {shippingAddresses.map((addr) => (
                            <SelectItem key={addr.id} value={addr.id}>
                              {`${addr.contact_name} - ${addr.street_line_1}, ${addr.city} (${addr.postal_code}) ${addr.is_default ? "[Alamat Utama]" : ""}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Detail Alamat Terpilih */}
                      {(() => {
                        const selectedAddr = shippingAddresses.find((a) => a.id === formData.shipping_address_id);
                        if (!selectedAddr) return null;
                        return (
                          <div className="p-4 bg-muted/30 border border-border/10 rounded-2xl text-sm text-foreground space-y-1.5 animate-in fade-in duration-200">
                            <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">Detail Alamat Pengiriman Terpilih:</p>
                            <p className="font-semibold text-base">{selectedAddr.contact_name}</p>
                            <p className="text-muted-foreground">{selectedAddr.street_line_1}</p>
                            {selectedAddr.street_line_2 && <p className="text-muted-foreground">{selectedAddr.street_line_2}</p>}
                            <p className="text-muted-foreground">
                              {selectedAddr.city}
                              {selectedAddr.state_province ? `, ${selectedAddr.state_province}` : ""}
                              {` ${selectedAddr.postal_code}`}
                            </p>
                            {selectedAddr.phone_number && (
                              <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{selectedAddr.phone_number}</span>
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Menyiapkan alamat...</div>
                  )
                ) : (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex flex-col gap-2">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span>Kamu belum menambahkan alamat pengiriman!</span>
                    </p>
                    <p>
                      Untuk dapat membuat request, silakan tambahkan alamat pengiriman kamu terlebih dahulu di dashboard agar FedEx dapat memproses pengiriman dengan benar.
                    </p>
                    <Link
                      href="/dashboard"
                      className="font-bold underline hover:text-negative-deep transition-colors w-fit"
                    >
                      Buka Pengaturan Alamat di Dashboard →
                    </Link>
                  </div>
                )}
              </div>

              {/* Deskripsi & Link Referensi */}
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-1.5">
                  Catatan Detail / Deskripsi Barang (Opsional)
                </Label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Contoh: Warna hitam, ukuran M, atau beli di toko Bic Camera Shibuya."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-background border border-border/20 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Link Referensi */}
                <div>
                  <Label className="block text-sm font-semibold text-foreground mb-1.5">
                    Link Referensi Produk (Opsional)
                  </Label>
                  <Input
                    type="url"
                    name="reference_link"
                    placeholder="https://example.com/product"
                    value={formData.reference_link}
                    onChange={handleChange}
                    className="w-full h-11 bg-background border border-border/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                  />
                </div>

                {/* Estimasi Berat */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="block text-sm font-semibold text-foreground mb-1.5">
                      Estimasi Berat
                    </Label>
                    <Input
                      type="number"
                      name="weight_value"
                      step="0.01"
                      min="0"
                      placeholder="0.5"
                      value={formData.weight_value || ""}
                      onChange={handleChange}
                      className="w-full h-11 bg-background border border-border/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                    />
                  </div>
                  <div className="w-24">
                    <Label className="block text-sm font-semibold text-foreground mb-1.5">
                      Satuan
                    </Label>
                    {formData.weight_unit && (
                      <Select
                        value={formData.weight_unit}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, weight_unit: val || "KG" }))}
                      >
                        <SelectTrigger className="w-full h-11 bg-background border border-border/20 rounded-xl px-4">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KG">KG</SelectItem>
                          <SelectItem value="LB">LB</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Foto Referensi */}
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-1.5">
                  Foto Referensi Barang (Opsional)
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-wise-green-pale file:text-positive-deep cursor-pointer border border-border/20 rounded-xl bg-background p-1"
                />
                {previewUrl && (
                  <div className="mt-3 p-3 bg-wise-green-pale/30 border border-wise-green-neutral rounded-2xl flex items-center gap-4 animate-in fade-in duration-200">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-border/10 shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">Preview Foto Terpilih</p>
                      <p className="text-xs text-muted-foreground">{photoFile?.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-border/10">
                <Button
                  type="submit"
                  disabled={isSubmitting || shippingAddresses.length === 0}
                  className="w-full button-primary text-base sm:text-lg h-14 rounded-2xl flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      <span>Mengirim Request ke Seller...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Request ke Seller</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Memuat formulir...</div>}>
      <RequestFormContent />
    </Suspense>
  );
}
