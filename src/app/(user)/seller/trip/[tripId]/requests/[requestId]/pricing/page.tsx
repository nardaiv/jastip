"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Check, 
  Truck, 
  Scale, 
  MapPin, 
  Loader2, 
  AlertCircle, 
  Info 
} from "lucide-react";
import { getFedExRatesAction } from "@/app/actions/fedex";

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

  // FedEx integration states
  const [useFedEx, setUseFedEx] = useState(false);
  const [buyerAddress, setBuyerAddress] = useState<any>(null);
  const [sellerAddresses, setSellerAddresses] = useState<any[]>([]);
  const [selectedSellerAddressId, setSelectedSellerAddressId] = useState<string>("");
  const [weightValue, setWeightValue] = useState<number>(1.0);
  const [weightUnit, setWeightUnit] = useState<"KG" | "LB">("KG");
  const [loadingRates, setLoadingRates] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("item_requests")
        .select("item_name, currency, buyer_id, shipping_address_id")
        .eq("id", requestId)
        .single();

      if (!error && data) {
        setItemName(data.item_name);
        const itemCurrency = data.currency || "USD";
        setCurrency(itemCurrency);

        // Fetch buyer's address
        let resolvedBuyerAddress = null;
        if (data.shipping_address_id) {
          const { data: addressData } = await supabase
            .from("shipping_addresses")
            .select("*")
            .eq("id", data.shipping_address_id)
            .single();
          resolvedBuyerAddress = addressData;
        } else if (data.buyer_id) {
          const { data: addressData } = await supabase
            .from("shipping_addresses")
            .select("*")
            .eq("user_id", data.buyer_id)
            .eq("is_default", true)
            .maybeSingle();
          resolvedBuyerAddress = addressData;
        }
        setBuyerAddress(resolvedBuyerAddress);

        // Fetch seller's addresses
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: sellerAddrs } = await supabase
            .from("shipping_addresses")
            .select("*")
            .eq("user_id", user.id);
          if (sellerAddrs) {
            setSellerAddresses(sellerAddrs);
            const defaultAddr = sellerAddrs.find(addr => addr.is_default) || sellerAddrs[0];
            if (defaultAddr) {
              setSelectedSellerAddressId(defaultAddr.id);
            }
          }
        }

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

  const handleGetRates = async () => {
    if (!buyerAddress) {
      setRatesError("Buyer tidak memiliki alamat pengiriman default atau terpilih.");
      return;
    }
    const sellerAddress = sellerAddresses.find(a => a.id === selectedSellerAddressId);
    if (!sellerAddress) {
      setRatesError("Silakan pilih alamat pengirim (seller) terlebih dahulu.");
      return;
    }

    setLoadingRates(true);
    setRatesError(null);
    setRates([]);

    try {
      const res = await getFedExRatesAction({
        shipperPostalCode: sellerAddress.postal_code,
        shipperCountryCode: sellerAddress.country_code,
        recipientPostalCode: buyerAddress.postal_code,
        recipientCountryCode: buyerAddress.country_code,
        weightValue,
        weightUnit,
      });

      if (res.success) {
        const replyDetails = res.data?.output?.rateReplyDetails || [];
        setRates(replyDetails);
        if (replyDetails.length > 0) {
          handleSelectRate(replyDetails[0]);
        } else {
          setRatesError("Tidak ada tarif carrier yang cocok untuk rute dan paket ini.");
        }
      } else {
        setRatesError(res.error || "Gagal mengestimasi ongkos kirim.");
      }
    } catch (err: any) {
      setRatesError(err?.message || "Terjadi kesalahan saat menghubungi FedEx.");
    } finally {
      setLoadingRates(false);
    }
  };

  const handleSelectRate = async (rate: any) => {
    setSelectedService(rate.serviceType);

    const ratedShipmentDetail = rate?.ratedShipmentDetails?.[0];
    if (!ratedShipmentDetail) return;
    
    const netCharge = ratedShipmentDetail.totalNetCharge !== undefined
      ? ratedShipmentDetail.totalNetCharge 
      : ratedShipmentDetail.shipmentRateDetail?.totalNetCharge;
      
    const rateCurrency = ratedShipmentDetail.shipmentRateDetail?.currency || "USD";
    const chargeVal = Number(netCharge) || 0;

    if (rateCurrency === "IDR") {
      setShippingFee(Math.round(chargeVal));
    } else {
      try {
        const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${rateCurrency}&symbols=IDR`);
        const apiData = await res.json();
        if (apiData.rates && apiData.rates.IDR) {
          setShippingFee(Math.round(chargeVal * apiData.rates.IDR));
        } else {
          const fallbackRate = rateCurrency === "USD" ? 15000 : 1;
          setShippingFee(Math.round(chargeVal * fallbackRate));
        }
      } catch (err) {
        const fallbackRate = rateCurrency === "USD" ? 15000 : 1;
        setShippingFee(Math.round(chargeVal * fallbackRate));
      }
    }
  };

  const getNetChargeDisplay = (rate: any) => {
    const ratedShipmentDetail = rate?.ratedShipmentDetails?.[0];
    if (!ratedShipmentDetail) return "";
    const netCharge = ratedShipmentDetail.totalNetCharge !== undefined
      ? ratedShipmentDetail.totalNetCharge 
      : ratedShipmentDetail.shipmentRateDetail?.totalNetCharge;
    const currency = ratedShipmentDetail.shipmentRateDetail?.currency || "USD";
    return `${currency} ${Number(netCharge).toFixed(2)}`;
  };

  const getTransitTimeDisplay = (rate: any) => {
    return rate?.deliveryDetails?.businessTransitTime?.replace(/_/g, " ") || "N/A";
  };

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

    const updatePayload: any = {
      agreed_price: agreedPriceIdr,
      jastip_fee: jastipFeeIdr,
      shipping_fee: safeShippingFee,
      total_price: totalPriceIdr,
      status: "purchased",
    };

    if (useFedEx) {
      updatePayload.shipping_address_id = buyerAddress?.id || null;
      updatePayload.sender_address_id = selectedSellerAddressId || null;
      updatePayload.weight_value = weightValue;
      updatePayload.weight_unit = weightUnit;
    }

    const { error } = await supabase
      .from("item_requests")
      .update(updatePayload)
      .eq("id", requestId);

    setSaving(false);

    if (!error) {
      router.push(`/seller/trip/${params.tripId}/requests`);
      router.refresh();
    } else {
      alert("Gagal menyimpan harga.");
    }
  };

  const activeSellerAddress = sellerAddresses.find(a => a.id === selectedSellerAddressId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="text-sm text-muted-foreground animate-pulse">Menyiapkan halaman...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 pt-8">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        
        {/* Header */}
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

                  {/* Toggle Pengiriman */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-medium">Metode Ongkos Kirim</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={!useFedEx ? "default" : "outline"}
                        className="h-12 rounded-xl font-medium border-none ring-0 text-sm"
                        onClick={() => {
                          setUseFedEx(false);
                          setShippingFee("");
                          setRates([]);
                        }}
                      >
                        Input Manual
                      </Button>
                      <Button
                        type="button"
                        variant={useFedEx ? "default" : "outline"}
                        className="h-12 rounded-xl font-medium border-none ring-0 text-sm flex gap-2 items-center justify-center"
                        onClick={() => setUseFedEx(true)}
                      >
                        <Truck className="w-4 h-4" /> Hitung FedEx
                      </Button>
                    </div>
                  </div>

                  {!useFedEx ? (
                    /* Input Ongkos Kirim Manual */
                    <div className="space-y-3 pt-2">
                      <Label className="text-sm font-medium">Ongkos Kirim Domestik</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-muted-foreground font-medium text-sm">Rp</span>
                        <Input
                          required={!useFedEx}
                          type="number"
                          min="0"
                          className="pl-12 h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base"
                          placeholder="0"
                          value={shippingFee}
                          onChange={(e) => setShippingFee(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Kalkulator FedEx */
                    <div className="space-y-6 pt-2 border-t border-dashed border-border mt-4">
                      
                      {/* Destination Address (Buyer) Summary */}
                      <div className="bg-muted/10 p-5 rounded-2xl border border-muted/30 space-y-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500" /> Alamat Tujuan (Buyer)
                        </span>
                        {buyerAddress ? (
                          <div className="text-xs text-foreground space-y-1">
                            <p className="font-semibold">{buyerAddress.contact_name} ({buyerAddress.phone_number})</p>
                            <p className="text-muted-foreground">
                              {buyerAddress.street_line_1}
                              {buyerAddress.street_line_2 && `, ${buyerAddress.street_line_2}`}
                            </p>
                            <p className="text-muted-foreground">
                              {buyerAddress.city}, {buyerAddress.state_or_province_code || ""} {buyerAddress.postal_code}, {buyerAddress.country_code}
                            </p>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-600 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Buyer belum mengatur alamat pengiriman. Hubungi buyer terlebih dahulu atau gunakan input manual.</span>
                          </div>
                        )}
                      </div>

                      {/* Origin Address (Seller) Selector */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Alamat Asal (Seller / Shipper)</Label>
                        {sellerAddresses.length > 0 ? (
                          <div className="relative">
                            <select
                              value={selectedSellerAddressId}
                              onChange={(e) => setSelectedSellerAddressId(e.target.value)}
                              className="w-full h-14 bg-muted/30 border-none ring-0 focus:ring-1 focus:ring-ring shadow-sm rounded-2xl text-base px-4 outline-none appearance-none"
                            >
                              {sellerAddresses.map((addr) => (
                                <option key={addr.id} value={addr.id}>
                                  {addr.contact_name} - {addr.city}, {addr.country_code}
                                </option>
                              ))}
                            </select>
                            
                            {activeSellerAddress && (
                              <div className="text-xs text-muted-foreground mt-2 pl-1 space-y-0.5">
                                <p>{activeSellerAddress.street_line_1}</p>
                                <p>{activeSellerAddress.city}, {activeSellerAddress.state_or_province_code || ""} {activeSellerAddress.postal_code}, {activeSellerAddress.country_code}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-amber-600 flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Anda belum memiliki alamat tersimpan. Silakan tambahkan alamat pengirim di profil Anda terlebih dahulu.</span>
                          </div>
                        )}
                      </div>

                      {/* Weight and Unit */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-muted-foreground" /> Berat Paket
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required={useFedEx}
                            className="h-14 bg-muted/30 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring shadow-sm rounded-2xl text-base"
                            value={weightValue}
                            onChange={(e) => setWeightValue(Number(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Satuan Berat</Label>
                          <select
                            value={weightUnit}
                            onChange={(e) => setWeightUnit(e.target.value as "KG" | "LB")}
                            className="w-full h-14 bg-muted/30 border-none ring-0 focus:ring-1 focus:ring-ring shadow-sm rounded-2xl text-base px-4 outline-none appearance-none"
                          >
                            <option value="KG">Kilogram (KG)</option>
                            <option value="LB">Pound (LB)</option>
                          </select>
                        </div>
                      </div>

                      {/* Fetch Rates Button */}
                      <Button
                        type="button"
                        onClick={handleGetRates}
                        disabled={loadingRates || !buyerAddress || !selectedSellerAddressId}
                        className="w-full h-12 rounded-xl font-semibold gap-2 border-none ring-0 bg-primary/95 hover:bg-primary"
                      >
                        {loadingRates ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Menghitung Tarif...
                          </>
                        ) : (
                          <>
                            Hitung Tarif Pengiriman
                          </>
                        )}
                      </Button>

                      {/* Error Display */}
                      {ratesError && (
                        <div className="text-xs text-red-600 flex items-start gap-2 bg-red-50 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-200">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{ratesError}</span>
                        </div>
                      )}

                      {/* FedEx Service Selection */}
                      {rates.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Pilih Layanan FedEx</Label>
                          <div className="grid gap-3">
                            {rates.map((rate) => {
                              const isSelected = selectedService === rate.serviceType;
                              return (
                                <div
                                  key={rate.serviceType}
                                  onClick={() => handleSelectRate(rate)}
                                  className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between hover:scale-[1.01] duration-200 ${
                                    isSelected
                                      ? "bg-[#e2f6d5] border-[#9fe870] shadow-sm dark:bg-emerald-950/20 dark:border-emerald-600"
                                      : "bg-muted/10 border-transparent hover:border-muted/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                      isSelected ? "bg-[#9fe870] text-[#0e0f0c]" : "bg-muted/30 text-muted-foreground"
                                    }`}>
                                      <Truck className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-xs text-foreground">{rate.serviceName || rate.serviceType}</p>
                                      <p className="text-[10px] text-muted-foreground mt-0.5">Est. Transit: {getTransitTimeDisplay(rate)}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-black text-foreground">{getNetChargeDisplay(rate)}</p>
                                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">FedEx Rate</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Selected Shipping Cost Output Display */}
                      {selectedService && (
                        <div className="bg-[#e2f6d5]/50 dark:bg-emerald-950/10 p-4 rounded-2xl border border-[#9fe870]/30 flex justify-between items-center text-xs">
                          <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-[#9fe870] dark:text-emerald-500" /> Ongkos kirim terhitung
                          </span>
                          <span className="font-bold text-foreground">
                            Rp {safeShippingFee.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}

                    </div>
                  )}

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
                  disabled={saving || (useFedEx && !selectedService)}
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