"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Check } from "lucide-react";

export default function PricingPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [itemName, setItemName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(15000);

  const [foreignPrice, setForeignPrice] = useState<number | "">("");
  const [feePercent, setFeePercent] = useState<number | "">(10);
  const [shippingFee, setShippingFee] = useState<number | "">("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("item_requests")
        .select("item_name, currency")
        .eq("id", requestId)
        .single();

      if (!error && data) {
        setItemName(data.item_name);
        const itemCurrency = data.currency || "USD";
        setCurrency(itemCurrency);

        if (itemCurrency !== "IDR") {
          try {
            const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${itemCurrency}&symbols=IDR`);
            const apiData = await res.json();
            if (apiData.rates && apiData.rates.IDR) {
              setExchangeRate(apiData.rates.IDR);
            }
          } catch (err) {
            console.error("Gagal mengambil kurs.", err);
          }
        } else {
          setExchangeRate(1);
        }
      }
      setLoading(false);
    }

    fetchData();
  }, [requestId]);

  const safeForeignPrice = Number(foreignPrice) || 0;
  const safeFeePercent = Number(feePercent) || 0;
  const safeShippingFee = Number(shippingFee) || 0;

  const agreedPriceIdr = safeForeignPrice * exchangeRate;
  const jastipFeeIdr = agreedPriceIdr * (safeFeePercent / 100);
  const totalPriceIdr = agreedPriceIdr + jastipFeeIdr + safeShippingFee;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (safeForeignPrice <= 0) return alert("Harga barang tidak boleh kosong.");

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("item_requests")
      .update({
        agreed_price: agreedPriceIdr,
        jastip_fee: jastipFeeIdr,
        shipping_fee: safeShippingFee,
        total_price: totalPriceIdr,
        status: "purchased",
      })
      .eq("id", requestId);

    setSaving(false);

    if (!error) {
      router.push(`/seller/trip/${params.tripId}/requests`);
      router.refresh();
    } else {
      alert("Gagal menyimpan harga.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="text-sm text-muted-foreground animate-pulse">Menyiapkan halaman...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        
        {/* Header Tanpa Border */}
        <div className="flex items-center gap-4 pb-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-10 w-10 shrink-0 shadow-sm bg-background hover:bg-muted border-none ring-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Set Price
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rincian harga untuk <span className="font-medium text-foreground">{itemName}</span>
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Kolom Kiri: Form Input */}
          <div className="lg:col-span-7">
            <Card className="rounded-[2rem] border-none ring-0 shadow-sm">
              <CardContent className="p-8 space-y-7">
                <form id="pricing-form" onSubmit={handleSave} className="space-y-6">
                  
                  {/* Input Harga Asing */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Harga Barang Asli</Label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-muted-foreground font-medium text-sm">{currency}</span>
                      <Input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-14 h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base"
                        placeholder="0.00"
                        value={foreignPrice}
                        onChange={(e) => setForeignPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    {foreignPrice !== "" && (
                      <p className="text-[13px] text-muted-foreground pl-1">
                        ≈ Rp {agreedPriceIdr.toLocaleString("id-ID", { maximumFractionDigits: 0 })} 
                        <span className="opacity-70 ml-1">(Kurs: Rp {exchangeRate.toLocaleString("id-ID", { maximumFractionDigits: 2 })})</span>
                      </p>
                    )}
                  </div>

                  {/* Input Fee Jastip */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Fee Jastip</Label>
                    <div className="relative flex items-center">
                      <Input
                        required
                        type="number"
                        min="0"
                        className="pr-12 h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base"
                        placeholder="10"
                        value={feePercent}
                        onChange={(e) => setFeePercent(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                      <span className="absolute right-5 text-muted-foreground font-medium text-sm">%</span>
                    </div>
                  </div>

                  {/* Input Ongkos Kirim */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-medium">Ongkos Kirim Domestik</Label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-muted-foreground font-medium text-sm">Rp</span>
                      <Input
                        required
                        type="number"
                        min="0"
                        className="pl-12 h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base"
                        placeholder="0"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                  </div>

                </form>
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Summary Nota */}
          <div className="lg:col-span-5 sticky top-8">
            <Card className="rounded-[2rem] border-none ring-0 shadow-sm overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <h3 className="font-semibold text-foreground">Estimasi Tagihan</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Harga Barang</span>
                    <span className="font-medium text-foreground">
                      Rp {agreedPriceIdr.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Fee Jastip ({safeFeePercent}%)</span>
                    <span className="font-medium text-foreground">
                      Rp {jastipFeeIdr.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Ongkos Kirim</span>
                    <span className="font-medium text-foreground">
                      Rp {safeShippingFee.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed border-border mt-2">
                  <div className="flex justify-between items-end">
                    <span className="font-medium text-muted-foreground text-sm">Total Dibayar</span>
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      Rp {totalPriceIdr.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 bg-muted/30 border-t-0">
                <Button 
                  type="submit" 
                  form="pricing-form"
                  disabled={saving}
                  className="w-full h-14 rounded-2xl font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all border-none ring-0"
                >
                  {saving ? "Menyimpan..." : (
                    <span className="flex items-center gap-2">
                      Konfirmasi Harga <Check className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}