"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { 
  ShoppingBag, 
  Plane, 
  ArrowRight, 
  HelpCircle, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  PlusCircle,
  Truck,
  HeartHandshake
} from "lucide-react";

interface LandingPageClientProps {
  user: any;
  activeTrips: any[];
  heroTrip: any | null;
}

export function LandingPageClient({ user, activeTrips, heroTrip }: LandingPageClientProps) {
  // Container animation utility
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas-soft font-sans text-ink antialiased">
      {/* Header Navbar */}
      <header className="sticky top-0 z-50 w-full bg-canvas border-b border-canvas-soft/85 py-4">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display font-black text-2xl text-ink"
          >
            <img src="/logo.svg" alt="Jastip Logo" className="h-8 w-8 hover:rotate-6 transition-transform" />
            <span className="tracking-tight text-ink dark:text-zinc-50">
              Jastip
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-body-sm-strong text-ink dark:text-zinc-300">
            <a href="#how-it-works" className="hover:text-primary transition-colors font-semibold">
              Cara Kerja
            </a>
            <a href="#featured-trips" className="hover:text-primary transition-colors font-semibold">
              Trip Pilihan
            </a>
            <a href="#why-us" className="hover:text-primary transition-colors font-semibold">
              Mengapa Jastip
            </a>
          </nav>

          {/* Auth CTA Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <button className="button-primary text-sm font-semibold cursor-pointer">
                  Buka Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="button-secondary text-sm font-semibold px-5 py-2.5 h-10 cursor-pointer">
                    Masuk
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="button-primary text-sm font-semibold px-5 py-2.5 h-10 cursor-pointer">
                    Daftar
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-28 lg:pb-32 bg-canvas-soft overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content Column */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8 lg:col-span-7 text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-wise-green-pale border border-wise-green-neutral text-ink-deep text-xs font-semibold uppercase tracking-wider">
                🚀 Pengiriman Peer-to-Peer Praktis & Cerdas
              </div>

              <h1 className="text-display-xl text-ink font-black tracking-tight leading-[1.1]">
                Titip Barang Apa Saja <br />
                <span className="text-emerald-700 dark:text-primary">
                  Dari Mana Saja.
                </span>
              </h1>

              <p className="text-body-lg text-body leading-relaxed max-w-2xl">
                Ingin makanan khas lokal, brand fashion ternama, atau produk unik yang tidak tersedia di Indonesia? 
                Hubungi traveler yang sedang berkunjung ke luar negeri dan dapatkan kiriman Anda dengan aman.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href={user ? "/dashboard" : "/signup"}
                  className="w-full sm:w-auto"
                >
                  <button className="button-primary w-full sm:w-auto text-base font-semibold h-12 px-8 cursor-pointer">
                    Mulai Titip Barang
                  </button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <button className="button-tertiary w-full sm:w-auto text-base font-semibold h-12 px-8 cursor-pointer">
                    Lihat Cara Kerja
                  </button>
                </a>
              </div>
            </motion.div>

            {/* Right Traveler Card Column */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 80 }}
              className="lg:col-span-5 relative"
            >
              {heroTrip ? (
                <div className="card-content max-w-sm mx-auto hover:scale-[1.02] transition-transform duration-300 shadow-xl border border-canvas-soft/85 bg-card">
                  {/* Traveler Card Title */}
                  <div className="flex items-center justify-between border-b border-canvas-soft pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-canvas-soft flex items-center justify-center font-bold text-ink text-sm">
                        {(heroTrip.seller?.full_name || "Traveler").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-body-sm-strong text-ink">
                          {heroTrip.seller?.full_name || "Traveler"}
                        </h4>
                      </div>
                    </div>
                    <span className="badge-positive">Trip Aktif</span>
                  </div>

                  {/* Trip Route */}
                  <div className="space-y-3 mb-5">
                    <div className="text-body-sm-strong font-black text-foreground leading-tight line-clamp-1" title={heroTrip.title}>
                      {heroTrip.title || `Trip ke ${heroTrip.destination_country}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-caption font-semibold text-mute">
                        TUJUAN
                      </span>
                      <span className="text-body-sm-strong text-ink">
                        {heroTrip.destination_country}
                      </span>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="bg-canvas-soft p-4 rounded-md space-y-2 border border-canvas-soft">
                    <div className="flex justify-between text-caption">
                      <span className="text-mute">Tanggal Keberangkatan</span>
                      <span className="font-semibold text-ink">
                        {new Date(heroTrip.start_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Call to action inside card */}
                  <Link
                    href={user ? "/dashboard" : "/signup"}
                    className="block mt-5"
                  >
                    <button className="button-primary w-full text-xs font-semibold py-2.5 rounded-xl cursor-pointer">
                      Kirim Request Titipan
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="card-content max-w-sm mx-auto text-center py-10 space-y-4 shadow-xl border border-canvas-soft/85">
                  <div className="h-12 w-12 rounded-full bg-wise-green-pale text-ink flex items-center justify-center mx-auto">
                    <Plane className="w-6 h-6 text-emerald-700" />
                  </div>
                  <h4 className="text-body-lg font-bold text-ink">Belum Ada Trip Aktif</h4>
                  <p className="text-body-sm text-body">
                    Jadilah traveler pertama yang mendaftarkan jadwal keberangkatan Anda dan dapatkan tips tambahan!
                  </p>
                  <Link href={user ? "/dashboard" : "/signup"} className="block pt-2">
                    <button className="button-primary w-full text-xs font-semibold py-2.5 rounded-xl cursor-pointer">
                      Daftar Trip Baru
                    </button>
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how-it-works"
        className="py-20 lg:py-28 bg-canvas text-ink border-t border-canvas-soft"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-caption font-semibold uppercase tracking-wider text-emerald-700">
              ALUR KERJA
            </span>
            <h2 className="text-display-md text-ink font-black tracking-tight">
              Dua Peran, Satu Alur Kerja Praktis
            </h2>
            <p className="text-body-md text-body">
              Jastip menghubungkan pembeli yang mencari barang impor dengan pelancong yang ingin menghasilkan uang saku tambahan.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2">
            {/* Buyer Path */}
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="card-feature-sage space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-canvas flex items-center justify-center border border-emerald-500/20">
                  <ShoppingBag className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="text-display-xs text-ink font-semibold">
                  Untuk Pembeli (Buyer)
                </h3>
              </div>
              <ul className="space-y-4 text-body-sm text-body">
                <motion.li variants={itemVariants} className="flex gap-3">
                  <span className="font-bold text-ink">1.</span>
                  <span>
                    <strong>Kirim Request:</strong> Buat titipan belanjaan baru dengan rincian barang, kuantitas, dan estimasi harga.
                  </span>
                </motion.li>
                <motion.li variants={itemVariants} className="flex gap-3">
                  <span className="font-bold text-ink">2.</span>
                  <span>
                    <strong>Pencocokan Traveler:</strong> Traveler yang melakukan perjalanan dari rute asal tersebut akan menerima penawaran harga.
                  </span>
                </motion.li>
                <motion.li variants={itemVariants} className="flex gap-3">
                  <span className="font-bold text-ink">3.</span>
                  <span>
                    <strong>Bayar Melalui Rekber:</strong> Bayar dengan aman. Dana Anda akan disimpan di rekening bersama (escrow) Jastip hingga barang tiba.
                  </span>
                </motion.li>
                <motion.li variants={itemVariants} className="flex gap-3">
                  <span className="font-bold text-ink">4.</span>
                  <span>
                    <strong>Terima & Konfirmasi:</strong> Setelah barang diterima, lakukan konfirmasi agar dana dicairkan ke traveler.
                  </span>
                </motion.li>
              </ul>
            </motion.div>

            {/* Traveler Path */}
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="card-feature-green space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-canvas flex items-center justify-center border border-emerald-500/20">
                  <Plane className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="text-display-xs text-ink font-semibold">
                  Untuk Traveler (Seller)
                </h3>
              </div>
              <ul className="space-y-4 text-body-sm text-body">
                <motion.li variants={itemVariants} className="flex gap-3">
                  <span className="font-bold text-ink">1.</span>
                  <span>
                    <strong>Daftarkan Trip:</strong> Daftarkan jadwal penerbangan keberangkatan Anda, negara tujuan, serta sisa ruang bagasi.
                  </span>
                </motion.li>
                <motion.li variants={itemVariants} className="flex gap-3">
                  <span className="font-bold text-ink">2.</span>
                  <span>
                    <strong>Terima Titipan:</strong> Jelajahi request titipan barang dari pembeli lokal yang sesuai dengan rute trip Anda.
                  </span>
                </motion.li>
                <motion.li variants={itemVariants} className="flex gap-3">
                  <span className="font-bold text-ink">3.</span>
                  <span>
                    <strong>Belanja & Antar:</strong> Beli barang pesanan di luar negeri, bawa dalam koper, dan kirimkan setibanya di tanah air.
                  </span>
                </motion.li>
                <motion.li variants={itemVariants} className="flex gap-3">
                  <span className="font-bold text-ink">4.</span>
                  <span>
                    <strong>Dapatkan Tips:</strong> Selesaikan pengiriman ke pembeli dan terima bayaran jasa titipan langsung ke dompet digital Anda.
                  </span>
                </motion.li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Trips Section */}
      <section
        id="featured-trips"
        className="py-20 lg:py-28 bg-canvas-soft text-ink border-t border-canvas-soft"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-caption font-semibold uppercase tracking-wider text-emerald-700">
              RUTE POPULER
            </span>
            <h2 className="text-display-md text-ink font-black tracking-tight">
              Rute Trip Traveler Pilihan
            </h2>
            <p className="text-body-md text-body">
              Jelajahi jadwal perjalanan pelancong aktif saat ini untuk mengirimkan titipan belanja Anda hari ini.
            </p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {activeTrips.length > 0 ? (
              activeTrips.map((trip) => (
                <motion.div 
                  key={trip.id} 
                  variants={itemVariants}
                  className="card-content space-y-4 hover:shadow-md transition-shadow bg-card border border-canvas-soft/85"
                >
                  <div className="flex items-center justify-between">
                    <span className="badge-positive uppercase font-bold text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(trip.start_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-black text-lg text-ink leading-snug line-clamp-1" title={trip.title}>
                      {trip.title || `Trip ke ${trip.destination_country}`}
                    </h4>
                    <p className="text-xs font-bold text-emerald-600 dark:text-primary flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {trip.destination_country}
                    </p>
                    <p className="text-caption text-mute pt-0.5">
                      Traveler: {trip.seller?.full_name || "Traveler"}
                    </p>
                  </div>
                  <Link href={user ? "/dashboard" : "/signup"} className="block">
                    <button className="button-tertiary w-full text-sm font-semibold py-2 cursor-pointer">
                      Titip Barang
                    </button>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full card-content p-12 text-center text-muted-foreground border border-canvas-soft shadow-xs space-y-3">
                <HelpCircle className="w-12 h-12 text-zinc-300 mx-auto" />
                <p className="font-semibold text-foreground">Belum Ada Trip Aktif</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Saat ini belum ada jadwal trip traveler yang terdaftar di sistem.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Why Jastip Section */}
      <section id="why-us" className="py-20 lg:py-28 bg-canvas text-ink border-t border-canvas-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-caption font-semibold uppercase tracking-wider text-emerald-700">
              KELEBIHAN KAMI
            </span>
            <h2 className="text-display-md text-ink font-black tracking-tight">
              Kenapa Memilih Jastip?
            </h2>
            <p className="text-body-md text-body">
              Kami merancang platform yang aman, transparan, dan dapat diandalkan baik untuk pembeli maupun pelancong.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="card-content p-6 border border-canvas-soft/85 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-700 dark:text-primary">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground">Rekening Bersama Aman</h4>
              <p className="text-caption text-mute leading-relaxed">
                Dana pembeli ditahan di sistem escrow Jastip dan hanya dicairkan setelah barang dikonfirmasi tiba dengan selamat.
              </p>
            </div>

            <div className="card-content p-6 border border-canvas-soft/85 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-700 dark:text-primary">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground">Layanan Pengiriman Resmi</h4>
              <p className="text-caption text-mute leading-relaxed">
                Platform kami terintegrasi dengan opsi pengiriman seperti FedEx untuk pelacakan rute kiriman secara live dan real-time.
              </p>
            </div>

            <div className="card-content p-6 border border-canvas-soft/85 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-700 dark:text-primary">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground">Verifikasi Pengguna Terpercaya</h4>
              <p className="text-caption text-mute leading-relaxed">
                Setiap traveler dan pembeli melewati proses KYC serta pembayaran diverifikasi admin demi keamanan transaksi komunitas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wise-inspired Footer */}
      <footer className="mt-auto py-12 bg-ink text-canvas-soft border-t border-canvas-soft/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-body-sm text-canvas-soft/75">
          <span>
            &copy; {new Date().getFullYear()} Jastip Nusantara. Seluruh hak cipta dilindungi.
          </span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Syarat & Ketentuan
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Pusat Bantuan
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
