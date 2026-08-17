"use client";

import { useState, useEffect, ChangeEvent, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";
import { uploadToStorage, updateUserProfile } from "@/lib/services/data-service";
import { AddressManager } from "@/components/AddressManager";

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const storeProfile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const updateProfileInStore = useUserStore((s) => s.updateProfile);

  // Tab state
  const tabParam = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(tabParam);

  // Sync tab state when URL changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Profile Form State
  const [formData, setFormData] = useState({
    fullName: "Ahmad Test",
    phone: "081234567890",
    role: "Buyer",
    avatarUrl: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [userId, setUserId] = useState("");

  // Password Reset State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          
          // Load Profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            setProfile(profile);
            setFormData({
              fullName: profile.full_name || "Ahmad Test",
              phone: profile.phone || profile.phone_number || "081234567890",
              role: profile.role || "Buyer",
              avatarUrl: profile.avatar_url || "",
            });
            setPreviewUrl(profile.avatar_url || null);
          }

          // Load Addresses
          const { data: addrs } = await supabase
            .from("shipping_addresses")
            .select("*")
            .eq("user_id", user.id);

          if (addrs) {
            setAddresses(addrs);
          }
          
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Profile load error:", e);
      }

      // Check localStorage fallback
      const savedName = localStorage.getItem("jastip_profile_name");
      const savedPhone = localStorage.getItem("jastip_profile_phone");
      const savedAvatar = localStorage.getItem("jastip_profile_avatar");

      setFormData({
        fullName: savedName || storeProfile?.full_name || "Ahmad Test",
        phone: savedPhone || storeProfile?.phone_number || "081234567890",
        role: storeProfile?.role || "Buyer",
        avatarUrl: savedAvatar || storeProfile?.avatar_url || "",
      });
      setPreviewUrl(savedAvatar || storeProfile?.avatar_url || null);
      setLoading(false);
    }

    loadProfile();
  }, [setProfile, supabase]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      let finalAvatarUrl = formData.avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await uploadToStorage(avatarFile, "avatars");
        if (finalAvatarUrl.startsWith("blob:")) {
          alert("Peringatan: Gagal mengunggah foto ke storage. Pastikan bucket 'avatars' sudah dibuat dan diset Public di Supabase Dashboard.");
        }
      }

      // Save to Supabase
      await updateUserProfile({
        full_name: formData.fullName,
        phone_number: formData.phone,
        avatar_url: finalAvatarUrl,
      });

      // Update Zustand Store
      updateProfileInStore({
        full_name: formData.fullName,
        phone_number: formData.phone,
        avatar_url: finalAvatarUrl,
      });

      // Save to localStorage for instant local reactivity
      localStorage.setItem("jastip_profile_name", formData.fullName);
      localStorage.setItem("jastip_profile_phone", formData.phone);
      if (finalAvatarUrl) {
        localStorage.setItem("jastip_profile_avatar", finalAvatarUrl);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (e) {
      console.error("Save profile error:", e);
      alert("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Password konfirmasi tidak cocok.");
      return;
    }
    setPasswordSaving(true);
    setPasswordSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      alert(`Gagal mereset password: ${err.message || String(err)}`);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto card-content border border-canvas-soft/85 dark:border-zinc-800/80 sm:p-10 space-y-6">
      <div className="flex items-center justify-between border-b border-canvas-soft dark:border-zinc-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-positive dark:text-wise-green bg-wise-green-pale dark:bg-wise-green-neutral/10 px-3 py-1 rounded-full border border-positive/10 dark:border-wise-green/10">
            Pusat Akun
          </span>
          <h1 className="text-display-xs sm:text-display-sm text-foreground mt-2">
            Pengaturan Profil & Akun
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola informasi profil, kelola alamat, dan atur keamanan kata sandi Anda.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors hidden sm:inline-block"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Tabs Navigator */}
      <div className="flex border-b border-canvas-soft dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "profile"
              ? "text-primary border-b-2 border-primary font-extrabold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Informasi Profil
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "addresses"
              ? "text-primary border-b-2 border-primary font-extrabold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Daftar Alamat
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "security"
              ? "text-primary border-b-2 border-primary font-extrabold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Keamanan & Sandi
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold">Memuat data akun...</p>
        </div>
      ) : (
        <div className="pt-2">
          {/* TAB 1: EDIT PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {savedSuccess && (
                <div className="p-4 bg-wise-green-pale dark:bg-positive-deep/20 border border-positive/20 text-positive-deep dark:text-wise-green rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <span>✓</span>
                  <span>Profil berhasil diperbarui dan disinkronisasi!</span>
                </div>
              )}

              {/* Foto Profil */}
              <div className="flex items-center gap-5 p-4 bg-canvas-soft/30 dark:bg-secondary/20 rounded-2xl border border-canvas-soft dark:border-zinc-800">
                <div className="w-20 h-20 rounded-full bg-wise-green-pale dark:bg-positive-deep/30 text-positive-deep dark:text-wise-green font-extrabold text-2xl flex items-center justify-center border-2 border-positive/10 dark:border-wise-green/10 shrink-0 overflow-hidden shadow-xs">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    formData.fullName.charAt(0).toUpperCase() || "A"
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                    Foto Avatar Profil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-wise-green-pale dark:file:bg-positive-deep/30 file:text-positive-deep dark:file:text-wise-green cursor-pointer border border-canvas-soft dark:border-zinc-800 rounded-xl bg-card p-1"
                  />
                  <p className="text-[11px] text-muted-foreground">Format JPG, PNG atau WEBP.</p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full bg-canvas-soft/30 dark:bg-secondary/20 border border-canvas-soft dark:border-zinc-800 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-foreground font-medium text-sm sm:text-base focus:outline-none transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Nomor Telepon (WhatsApp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-canvas-soft/30 dark:bg-secondary/20 border border-canvas-soft dark:border-zinc-800 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-foreground font-medium text-sm sm:text-base focus:outline-none transition-all"
                />
              </div>

              {/* Role Display */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Peran Akun
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.role}
                  className="w-full bg-canvas-soft/60 dark:bg-secondary/40 border border-canvas-soft/80 dark:border-zinc-800/80 rounded-xl px-4 py-2.5 text-muted-foreground text-sm font-bold cursor-not-allowed uppercase tracking-wider"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-canvas-soft dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="button-secondary w-full sm:w-1/2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="button-primary w-full sm:w-1/2 disabled:opacity-50 gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ADDRESS MANAGER */}
          {activeTab === "addresses" && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-canvas-soft dark:border-zinc-800">
                <h3 className="text-lg font-bold text-foreground">Daftar Alamat Pengiriman</h3>
                <p className="text-muted-foreground text-xs mt-1">
                  Tambahkan atau perbarui alamat pengiriman untuk proses hitung ongkir FedEx otomatis.
                </p>
              </div>
              <AddressManager userId={userId} initialAddresses={addresses} />
            </div>
          )}

          {/* TAB 3: PASSWORD RESET */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Keamanan & Sandi</h3>
                <p className="text-muted-foreground text-xs mt-1">
                  Perbarui kata sandi Supabase Anda secara aman. Gunakan kombinasi minimal 6 karakter.
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-4 bg-wise-green-pale dark:bg-positive-deep/20 border border-positive/20 text-positive-deep dark:text-wise-green rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <span>✓</span>
                  <span>Kata sandi berhasil diperbarui!</span>
                </div>
              )}

              {/* Password Baru */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-canvas-soft/30 dark:bg-secondary/20 border border-canvas-soft dark:border-zinc-800 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-foreground font-medium text-sm sm:text-base focus:outline-none transition-all"
                  placeholder="Ketik password baru"
                />
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-canvas-soft/30 dark:bg-secondary/20 border border-canvas-soft dark:border-zinc-800 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-foreground font-medium text-sm sm:text-base focus:outline-none transition-all"
                  placeholder="Ketik ulang password baru"
                />
              </div>

              <div className="pt-4 border-t border-canvas-soft dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="button-secondary w-full sm:w-1/2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="button-primary w-full sm:w-1/2 disabled:opacity-50 gap-2"
                >
                  {passwordSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Perbarui Sandi</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground card-content border border-canvas-soft dark:border-zinc-800 shadow-xl sm:p-10">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-muted-foreground">Memuat pengaturan akun...</p>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
