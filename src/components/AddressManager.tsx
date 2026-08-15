"use client";

import { useState } from "react";
import { z } from "zod";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Check, 
  Loader2, 
  AlertCircle, 
  Home, 
  Building 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  createShippingAddress, 
  updateShippingAddress, 
  deleteShippingAddress, 
  setDefaultShippingAddress 
} from "@/app/actions/shipping";

const AddressFormSchema = z.object({
  contact_name: z.string().min(2, "Nama penerima minimal 2 karakter"),
  company_name: z.string().nullable().optional(),
  phone_number: z.string().min(5, "Nomor telepon minimal 5 karakter"),
  street_line_1: z.string().min(5, "Alamat minimal 5 karakter"),
  street_line_2: z.string().nullable().optional(),
  city: z.string().min(2, "Kota minimal 2 karakter"),
  state_or_province_code: z.string().nullable().optional(),
  postal_code: z.string().min(3, "Kode pos minimal 3 karakter"),
  country_code: z.string().length(2, "Kode negara harus 2 huruf (contoh: ID, US)"),
  is_residential: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof AddressFormSchema>;

interface AddressManagerProps {
  userId: string;
  initialAddresses: any[];
}

export function AddressManager({ userId, initialAddresses }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<any[]>(initialAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Form states
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [streetLine1, setStreetLine1] = useState("");
  const [streetLine2, setStreetLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateOrProvince, setStateOrProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("ID");
  const [isResidential, setIsResidential] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setContactName("");
    setCompanyName("");
    setPhoneNumber("");
    setStreetLine1("");
    setStreetLine2("");
    setCity("");
    setStateOrProvince("");
    setPostalCode("");
    setCountryCode("ID");
    setIsResidential(true);
    setIsDefault(false);
    setError(null);
  };

  const startEdit = (address: any) => {
    setEditingAddress(address);
    setContactName(address.contact_name || "");
    setCompanyName(address.company_name || "");
    setPhoneNumber(address.phone_number || "");
    setStreetLine1(address.street_line_1 || "");
    setStreetLine2(address.street_line_2 || "");
    setCity(address.city || "");
    setStateOrProvince(address.state_or_province_code || "");
    setPostalCode(address.postal_code || "");
    setCountryCode(address.country_code || "ID");
    setIsResidential(address.is_residential ?? true);
    setIsDefault(address.is_default ?? false);
    setIsAdding(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: AddressFormValues = {
      contact_name: contactName,
      company_name: companyName || null,
      phone_number: phoneNumber,
      street_line_1: streetLine1,
      street_line_2: streetLine2 || null,
      city,
      state_or_province_code: stateOrProvince || null,
      postal_code: postalCode,
      country_code: countryCode.toUpperCase(),
      is_residential: isResidential,
      is_default: isDefault,
    };

    const validation = AddressFormSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      if (editingAddress) {
        // Edit Address
        await updateShippingAddress(editingAddress.id, userId, payload);
        
        // Update local state
        setAddresses((prev) =>
          prev.map((addr) => {
            if (payload.is_default && addr.id !== editingAddress.id) {
              return { ...addr, is_default: false };
            }
            if (addr.id === editingAddress.id) {
              return { ...addr, ...payload, country_code: payload.country_code };
            }
            return addr;
          })
        );
        showSuccess("Alamat berhasil diperbarui!");
      } else {
        // Add Address
        const res = await createShippingAddress({
          user_id: userId,
          ...payload,
        });

        if (res.success && res.addressId) {
          const newAddress = {
            id: res.addressId,
            user_id: userId,
            ...payload,
            country_code: payload.country_code,
          };
          setAddresses((prev) => {
            const updated = prev.map((addr) => 
              payload.is_default ? { ...addr, is_default: false } : addr
            );
            return [...updated, newAddress];
          });
          showSuccess("Alamat baru berhasil ditambahkan!");
        }
      }

      setEditingAddress(null);
      setIsAdding(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan alamat.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus alamat ini?")) return;
    setError(null);
    try {
      await deleteShippingAddress(addressId);
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      showSuccess("Alamat berhasil dihapus.");
    } catch (err: any) {
      setError(err.message || "Gagal menghapus alamat.");
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setError(null);
    try {
      await setDefaultShippingAddress(addressId, userId);
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          is_default: addr.id === addressId,
        }))
      );
      showSuccess("Alamat utama berhasil diubah!");
    } catch (err: any) {
      setError(err.message || "Gagal mengubah alamat utama.");
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Alert display */}
      {error && (
        <div className="text-xs text-red-600 flex items-start gap-2 bg-red-50 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-200 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="text-xs text-emerald-600 flex items-start gap-2 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Listing View */}
      {!isAdding && !editingAddress ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-display-xs text-ink dark:text-zinc-50 font-bold">
              Alamat Pengiriman Saya
            </h3>
            <Button
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="rounded-xl flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Tambah Alamat
            </Button>
          </div>

          {addresses.length === 0 ? (
            <div className="border border-dashed border-canvas-soft dark:border-zinc-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Belum ada alamat tersimpan</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Tambahkan alamat pengiriman agar Anda dapat menghitung tarif FedEx secara otomatis.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {addresses.map((addr) => (
                <Card 
                  key={addr.id}
                  className={`rounded-3xl border border-canvas-soft dark:border-zinc-800 shadow-sm transition-all hover:shadow-md ${
                    addr.is_default ? "border-primary/40 dark:border-primary/20 bg-primary/[0.02]" : ""
                  }`}
                >
                  <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">
                          {addr.contact_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-muted/50 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-medium">
                          {addr.phone_number}
                        </span>
                        
                        {addr.is_residential ? (
                          <Home className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Building className="w-3.5 h-3.5 text-muted-foreground" />
                        )}

                        {addr.is_default && (
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Utama
                          </span>
                        )}
                      </div>

                      {addr.company_name && (
                        <p className="text-xs text-muted-foreground font-medium">{addr.company_name}</p>
                      )}

                      <p className="text-xs text-muted-foreground font-medium">
                        {addr.street_line_1}
                        {addr.street_line_2 && `, ${addr.street_line_2}`}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {addr.city}, {addr.state_or_province_code || ""} {addr.postal_code}, {addr.country_code}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-dashed border-canvas-soft pt-3 md:pt-0 justify-end">
                      {!addr.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(addr.id)}
                          className="rounded-lg text-[10px] font-bold tracking-wide uppercase hover:bg-emerald-50 hover:text-emerald-600 h-8"
                        >
                          Set Utama
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => startEdit(addr)}
                        className="rounded-lg w-8 h-8 text-muted-foreground"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(addr.id)}
                        className="rounded-lg w-8 h-8 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Address Add/Edit Form View */
        <div className="card-content bg-white dark:bg-zinc-900 border border-canvas-soft dark:border-zinc-800 p-6 rounded-3xl space-y-6">
          <div>
            <h3 className="text-display-xs text-ink dark:text-zinc-50 font-bold">
              {editingAddress ? "Edit Alamat Pengiriman" : "Tambah Alamat Baru"}
            </h3>
            <p className="text-caption text-mute mt-1">
              {editingAddress ? "Perbarui informasi kontak dan alamat lengkap Anda." : "Masukkan informasi penerima dan detail alamat pengiriman."}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="contact_name" className="text-body-sm-strong text-ink dark:text-zinc-300">
                  Nama Penerima
                </Label>
                <Input
                  id="contact_name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Budi Santoso"
                  required
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="phone_number" className="text-body-sm-strong text-ink dark:text-zinc-300">
                  Nomor Telepon
                </Label>
                <Input
                  id="phone_number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+62812345678"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="company_name" className="text-body-sm-strong text-ink dark:text-zinc-300">
                Nama Perusahaan (Opsional)
              </Label>
              <Input
                id="company_name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="PT. Sukses Mandiri"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="street_line_1" className="text-body-sm-strong text-ink dark:text-zinc-300">
                  Alamat Baris 1
                </Label>
                <Input
                  id="street_line_1"
                  value={streetLine1}
                  onChange={(e) => setStreetLine1(e.target.value)}
                  placeholder="Jl. Raya Kebon Jeruk No. 12"
                  required
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="street_line_2" className="text-body-sm-strong text-ink dark:text-zinc-300">
                  Alamat Baris 2 (Opsional)
                </Label>
                <Input
                  id="street_line_2"
                  value={streetLine2}
                  onChange={(e) => setStreetLine2(e.target.value)}
                  placeholder="Lantai 3, Ruang 305"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 flex flex-col col-span-2 md:col-span-1">
                <Label htmlFor="city" className="text-body-sm-strong text-ink dark:text-zinc-300">
                  Kota
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Jakarta Barat"
                  required
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="state_or_province_code" className="text-body-sm-strong text-ink dark:text-zinc-300">
                  Provinsi (Kode)
                </Label>
                <Input
                  id="state_or_province_code"
                  value={stateOrProvince}
                  onChange={(e) => setStateOrProvince(e.target.value)}
                  placeholder="DKI"
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="postal_code" className="text-body-sm-strong text-ink dark:text-zinc-300">
                  Kode Pos
                </Label>
                <Input
                  id="postal_code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="11530"
                  required
                />
              </div>

              <div className="space-y-1.5 flex flex-col">
                <Label htmlFor="country_code" className="text-body-sm-strong text-ink dark:text-zinc-300">
                  Negara (2 Huruf)
                </Label>
                <Input
                  id="country_code"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  maxLength={2}
                  placeholder="ID"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
              <div className="flex items-center gap-3">
                <input
                  id="is_residential"
                  type="checkbox"
                  checked={isResidential}
                  onChange={(e) => setIsResidential(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <Label htmlFor="is_residential" className="text-xs text-muted-foreground select-none cursor-pointer">
                  Alamat Perumahan/Residensial
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="is_default"
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <Label htmlFor="is_default" className="text-xs text-muted-foreground select-none cursor-pointer">
                  Atur sebagai alamat utama
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-canvas-soft mt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl font-semibold gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>Simpan Alamat</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingAddress(null);
                  setIsAdding(false);
                  resetForm();
                }}
                className="w-28 h-11 rounded-xl font-semibold bg-background"
              >
                Batal
              </Button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
