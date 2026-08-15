import Link from "next/link";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[80vh] px-6 py-12 text-center bg-background text-foreground transition-colors duration-300">
      {/* Decorative background ambient blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
        <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-wise-green/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-accent-cyan/20 blur-3xl animate-pulse" />
      </div>

      <div className="max-w-md w-full space-y-8 flex flex-col items-center">
        {/* Animated Compass Icon */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-card border border-black/[0.04] dark:border-white/[0.05] shadow-xs text-wise-green transition-transform duration-500 hover:rotate-12">
          <Compass className="w-12 h-12 stroke-[1.5] text-[#9fe870]" />
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive animate-ping" />
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive" />
        </div>

        <div className="space-y-4">
          <h1 className="text-display-mega text-foreground tracking-tight select-none">
            404
          </h1>
          <h2 className="text-display-xs text-foreground tracking-tight sm:text-3xl">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-body-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Halaman yang Anda cari tidak dapat ditemukan. Mungkin tautan telah kedaluwarsa, salah ketik, atau telah dipindahkan ke alamat lain.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/" className="button-primary w-full sm:w-auto gap-2 group decoration-none">
            <Home className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            Kembali ke Beranda
          </Link>
          <Link href="/dashboard" className="button-secondary w-full sm:w-auto gap-2 group decoration-none">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
