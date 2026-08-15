-- ==============================================================================
-- JASTIP BUYER PLATFORM - SUPABASE DATABASE MIGRATION & STORAGE SETUP
-- ==============================================================================

-- 1. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'purchased', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. PROFILES TABLE (Sinkron dengan Auth Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT 'Ahmad Test',
  phone TEXT DEFAULT '081234567890',
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'Buyer',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now())
);

-- Trigger to create profile automatically on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Buyer User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'Buyer'),
    COALESCE(new.raw_user_meta_data->>'phone', '081234567890')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. SELLER TRIPS TABLE (Daftar Jadwal Trip Seller)
CREATE TABLE IF NOT EXISTS public.seller_trips (
  id SERIAL PRIMARY KEY,
  seller_name TEXT NOT NULL,
  country TEXT NOT NULL,
  flag TEXT NOT NULL,
  departure_date TEXT NOT NULL,
  return_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif', -- 'Aktif' | 'Mendatang'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now())
);

-- 4. BUYER REQUESTS TABLE (Barang Titipan Buyer)
CREATE TABLE IF NOT EXISTS public.buyer_requests (
  id TEXT PRIMARY KEY, -- Format: 'REQ-001'
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  merk TEXT NOT NULL,
  kuantitas INTEGER NOT NULL DEFAULT 1,
  seller_name TEXT NOT NULL,
  country TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  fee NUMERIC DEFAULT 0, -- 10% dari price
  shipping_fee NUMERIC DEFAULT 0, -- Estimasi ongkir
  photo_url TEXT,
  alamat TEXT NOT NULL,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now())
);

-- 5. PAYMENTS TABLE (Bukti Pembayaran)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT REFERENCES public.buyer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bank_account TEXT NOT NULL,
  proof_url TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now())
);

-- 6. TRACKING SHIPMENTS TABLE (Pelacakan Ekspedisi / FedEx)
CREATE TABLE IF NOT EXISTS public.tracking_shipments (
  id SERIAL PRIMARY KEY,
  request_id TEXT REFERENCES public.buyer_requests(id) ON DELETE CASCADE UNIQUE,
  courier TEXT DEFAULT 'FedEx Express (International Priority)',
  resi TEXT NOT NULL DEFAULT '7734 9182 0419',
  service_type TEXT DEFAULT 'FedEx International Priority®',
  estimated_delivery TEXT DEFAULT '26 Agustus 2026, 18:00 WIB',
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  timeline_logs JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now())
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_shipments ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES (Public read for active trips & requests, user scoped edits)
DROP POLICY IF EXISTS "Public can view seller trips" ON public.seller_trips;
CREATE POLICY "Public can view seller trips" ON public.seller_trips FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view requests" ON public.buyer_requests;
CREATE POLICY "Public can view requests" ON public.buyer_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert requests" ON public.buyer_requests;
CREATE POLICY "Anyone can insert requests" ON public.buyer_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update requests" ON public.buyer_requests;
CREATE POLICY "Anyone can update requests" ON public.buyer_requests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view payments" ON public.payments;
CREATE POLICY "Public can view payments" ON public.payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
CREATE POLICY "Anyone can insert payments" ON public.payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view tracking" ON public.tracking_shipments;
CREATE POLICY "Public can view tracking" ON public.tracking_shipments FOR SELECT USING (true);

-- 9. STORAGE BUCKETS (avatars, request-photos, payment-proofs)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('request-photos', 'request-photos', true),
  ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies (Allow public reads and public/authenticated uploads)
CREATE POLICY "Public can view storage objects" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'request-photos', 'payment-proofs'));
CREATE POLICY "Public can upload storage objects" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('avatars', 'request-photos', 'payment-proofs'));
CREATE POLICY "Public can update storage objects" ON storage.objects FOR UPDATE USING (bucket_id IN ('avatars', 'request-photos', 'payment-proofs'));

-- 10. SEED INITIAL DATA (Jadwal Trip & Sample Requests)
INSERT INTO public.seller_trips (seller_name, country, flag, departure_date, return_date, status)
VALUES
  ('Budi Santoso', '🇯🇵 Jepang', '🇯🇵', '20 Agustus 2026', '28 Agustus 2026', 'Aktif'),
  ('Siti Rahma', '🇸🇬 Singapura', '🇸🇬', '22 Agustus 2026', '25 Agustus 2026', 'Aktif'),
  ('Andi Wijaya', '🇰🇷 Korea Selatan', '🇰🇷', '01 September 2026', '10 September 2026', 'Mendatang')
ON CONFLICT DO NOTHING;

INSERT INTO public.buyer_requests (id, model, merk, kuantitas, seller_name, country, price, fee, shipping_fee, alamat, status)
VALUES
  ('REQ-000', 'Nintendo Switch OLED Joy-Con Red/Blue', 'Nintendo', 1, 'Budi (Jasa Titip JP)', '🇯🇵 Jepang', 4500000, 450000, 40000, 'Jl. Mawar No. 12, Jakarta', 'pending'),
  ('REQ-001', 'Matcha Powder Uji Premium 100g', 'Ito En', 2, 'Budi (Jasa Titip JP)', '🇯🇵 Jepang', 265000, 26500, 20000, 'Jl. Sudirman Kav 25, Jakarta Pusat', 'accepted'),
  ('REQ-002', 'Sony WH-1000XM5 Noise Canceling', 'Sony', 1, 'Budi (Jasa Titip JP)', '🇯🇵 Jepang', 3296700, 329670, 35000, 'Jl. Gatot Subroto No. 88, Jakarta Selatan', 'purchased'),
  ('REQ-003', 'MacBook Air M3 16/512GB', 'Apple', 1, 'Siti (SG Express)', '🇸🇬 Singapura', 15999000, 1599900, 50000, 'Jl. Asia Afrika No. 10, Bandung', 'rejected'),
  ('REQ-004', 'PlayStation 5 Slim Digital Edition', 'Sony', 1, 'Andi (Korea Jastip)', '🇰🇷 Korea Selatan', 7200000, 720000, 60000, 'Jl. Diponegoro No. 4, Surabaya', 'cancelled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tracking_shipments (request_id, courier, resi, service_type, estimated_delivery, steps, timeline_logs)
VALUES
  (
    'REQ-002',
    'FedEx Express (International Priority)',
    '7734 9182 0419',
    'FedEx International Priority®',
    '26 Agustus 2026, 18:00 WIB',
    '[
      {"id": 1, "title": "Pembayaran Dikonfirmasi", "date": "18 Agt 2026, 14:30", "status": "completed"},
      {"id": 2, "title": "Shipment Picked Up (FedEx Tokyo)", "date": "21 Agt 2026, 11:15", "status": "completed"},
      {"id": 3, "title": "In Transit - Flight Departed", "date": "23 Agt 2026, 08:00", "status": "active"},
      {"id": 4, "title": "Out for Delivery (FedEx Indonesia)", "date": "Estimasi 26 Agt 2026", "status": "pending"},
      {"id": 5, "title": "Delivered", "date": "-", "status": "pending"}
    ]'::JSONB,
    '[
      {"date": "23 Agt 2026 - 08:00 WIB", "location": "TOKYO - JAPAN", "note": "International shipment release - In transit to destination hub (FedEx Express Flight FX-519)"},
      {"date": "22 Agt 2026 - 19:45 WIB", "location": "NARITA HARBOR - JAPAN", "note": "At FedEx International Location / Clearance in progress"},
      {"date": "21 Agt 2026 - 11:15 WIB", "location": "GINZA, TOKYO - JAPAN", "note": "Picked up by FedEx Courier"},
      {"date": "18 Agt 2026 - 14:30 WIB", "location": "JAKARTA - INDONESIA", "note": "Shipment information sent to FedEx / Payment confirmed"}
    ]'::JSONB
  )
ON CONFLICT (request_id) DO NOTHING;
