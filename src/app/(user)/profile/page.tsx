"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";
import { uploadToStorage, updateUserProfile } from "@/lib/services/data-service";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const storeProfile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const updateProfileInStore = useUserStore((s) => s.updateProfile);

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

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
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
            setLoading(false);
            return;
          }
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
  }, [setProfile, storeProfile, supabase]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      let finalAvatarUrl = formData.avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await uploadToStorage(avatarFile, "avatars");
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

  return (
    <div className="w-full max-w-xl mx-auto bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-3 py-1 rounded-full border border-emerald-200">
                Pengaturan Akun
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-2">
                Edit Profil Buyer
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Kelola informasi nama, kontak, dan foto profil Anda.
              </p>
            </div>
            <Link
              href="/"
              className="text-sm font-semibold text-slate-500 hover:text-brand-green transition-colors hidden sm:inline-block"
            >
              ← Dashboard
            </Link>
          </div>

          {savedSuccess && (
            <div className="p-4 bg-brand-green-light border border-emerald-200 text-brand-green rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <span>✓</span>
              <span>Profil berhasil diperbarui dan disinkronisasi!</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-semibold">Memuat profil...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Foto Profil */}
              <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-20 h-20 rounded-full bg-brand-green-light text-brand-green font-extrabold text-2xl flex items-center justify-center border-2 border-emerald-200 shrink-0 overflow-hidden shadow-xs">
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
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Foto Avatar Profil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-green-light file:text-brand-green cursor-pointer border border-slate-200 rounded-xl bg-white p-1"
                  />
                  <p className="text-[11px] text-slate-400">Format JPG, PNG atau WEBP.</p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl px-4 py-3 text-slate-950 font-medium text-sm sm:text-base focus:outline-none transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Phone Number (WhatsApp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl px-4 py-3 text-slate-950 font-medium text-sm sm:text-base focus:outline-none transition-all"
                />
              </div>

              {/* Role Display */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Peran Akun
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.role}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 text-sm font-bold cursor-not-allowed uppercase tracking-wider"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full sm:w-1/2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-all text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-1/2 py-3.5 bg-brand-green hover:bg-[#43A047] text-white font-bold rounded-2xl text-sm transition-all shadow-md active:scale-95 text-center cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
  );
}
