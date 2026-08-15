"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { Calendar, MapPin, Plus, Search, Plane, ArrowRight, Sparkles } from "lucide-react";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

export default function TripPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setTrips(data);
        }
      }
      setLoading(false);
    }

    loadTrustProfile();
    loadTrips();
  }, []);

  async function loadTrustProfile() {}

  const filteredTrips = trips.filter(
    (trip) =>
      trip.destination_country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.destination_city?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      trip.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Kelola Trip Jastip <Sparkles className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buat dan pantau jadwal perjalanan belanja luar negeri Anda di sini.
          </p>
        </div>

        <Link href="/seller/trip/add">
          <Button className="h-11 px-6 rounded-xl font-semibold gap-2 shadow-sm transition-all hover:scale-[1.02]">
            <Plus className="w-4 h-4" /> Add Trip
          </Button>
        </Link>
      </div>

      {/* Search Bar Elegan Tanpa Border Gelap */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Cari berdasarkan judul trip, kota, atau negara tujuan..."
          className="pl-11 h-12 bg-white border-none shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40 text-sm outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Daftar Trip */}
      {loading ? (
        <div className="p-16 text-center text-muted-foreground animate-pulse text-sm">
          Memuat daftar trip Anda...
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl shadow-sm space-y-3">
          <div className="w-14 h-14 bg-muted/60 rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
            <Plane className="w-7 h-7" />
          </div>
          <p className="font-semibold text-foreground text-base">
            {searchQuery ? "Trip tidak ditemukan" : "Belum ada trip aktif"}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? "Coba gunakan kata kunci pencarian yang lain."
              : "Mulai buat jadwal trip pertama Anda dengan menekan tombol 'Add Trip' di atas."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTrips.map((trip) => {
            const isCompleted = trip.status === "completed";
            const isCancelled = trip.status === "cancelled";

            return (
              <div
                key={trip.id}
                className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Informasi Utama Trip */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {trip.title}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                        isCompleted
                          ? "bg-gray-100 text-gray-600"
                          : isCancelled
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground font-medium">
                    <div className="flex items-center gap-2 text-foreground/80 bg-muted/30 px-3 py-1 rounded-lg">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>
                        {trip.destination_city}, {trip.destination_country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-muted-foreground/70" />
                      <span>
                        {new Date(trip.start_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        —{" "}
                        {new Date(trip.end_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center self-end md:self-center w-full md:w-auto">
                  <Link href={`/seller/trip/${trip.id}/requests`} className="w-full md:w-auto">
                    <Button
                      variant="outline"
                      className="w-full md:w-auto h-11 px-5 rounded-full font-semibold gap-2 border-transparent bg-muted/40 hover:bg-primary hover:text-white transition-all shadow-none"
                    >
                      List Request
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}