"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, PlaneTakeoff, Plus } from "lucide-react";

export default function AddTripPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    destination_country: "",
    destination_city: "",
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Silakan login terlebih dahulu");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("trips").insert([
      {
        seller_id: user.id,
        title: formData.title,
        destination_country: formData.destination_country,
        destination_city: formData.destination_city,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: "active",
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Gagal menambahkan trip: " + error.message);
    } else {
      router.push("/seller/trip");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-24 pt-8">
      <div className="max-w-2xl mx-auto px-6 space-y-8">
        
        {/* Header Tanpa Border */}
        <div className="flex items-center gap-4 pb-2">
          <Button 
            type="button"
            variant="outline" 
            size="icon" 
            className="rounded-full h-10 w-10 shrink-0 shadow-sm bg-background hover:bg-muted border-none ring-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Tambah Trip Baru <PlaneTakeoff className="w-6 h-6 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Buat jadwal perjalanan jastip Anda selanjutnya.
            </p>
          </div>
        </div>

        {/* Card Form */}
        <Card className="rounded-[2rem] border-none ring-0 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-8 space-y-7">
              
              {/* Judul Trip */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Judul Trip</Label>
                <Input
                  required
                  placeholder="Contoh: Jastip Tokyo Summer Sale"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base px-5"
                />
              </div>

              {/* Negara Tujuan */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Negara Tujuan</Label>
                <Input
                  required
                  placeholder="Contoh: Jepang"
                  value={formData.destination_country}
                  onChange={(e) =>
                    setFormData({ ...formData, destination_country: e.target.value })
                  }
                  className="h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base px-5"
                />
              </div>

              {/* Kota Tujuan */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Kota Tujuan</Label>
                <Input
                  required
                  placeholder="Contoh: Tokyo"
                  value={formData.destination_city}
                  onChange={(e) =>
                    setFormData({ ...formData, destination_city: e.target.value })
                  }
                  className="h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base px-5"
                />
              </div>

              {/* Grid Tanggal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tanggal Mulai</Label>
                  <Input
                    required
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base px-5 block w-full appearance-none"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tanggal Selesai</Label>
                  <Input
                    required
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base px-5 block w-full appearance-none"
                  />
                </div>
              </div>

            </CardContent>

            <CardFooter className="p-4 bg-muted/30 border-t-0 flex justify-end">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto h-12 px-8 rounded-full font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all border-none ring-0 flex items-center gap-2"
              >
                {loading ? "Menyimpan..." : (
                  <>
                    <Plus className="w-5 h-5" /> Simpan Trip
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
      </div>
    </div>
  );
}