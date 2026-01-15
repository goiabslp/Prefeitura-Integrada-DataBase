-- SUPABASE OPTIMIZATION & RE-ARCHITECTURE SCRIPT (v3 - FIX 42703)
-- 
-- 1. Creates Sectors/Jobs tables safely.
-- 2. Migrates data from Profiles.
-- 3. Adds Performance Indexes (Corrected for existing schema).
-- 4. Enforces RLS Policies.
--
-- Run this in Supabase SQL Editor.

-- BEGIN TRANSACTION;

-------------------------------------------------------------------------------
-- 1. SCHEMA NORMALIZATION (Sectors & Jobs)
-------------------------------------------------------------------------------

-- 1. Create Tables (if not exist)
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add Unique Constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sectors_name_key') THEN
        ALTER TABLE public.sectors ADD CONSTRAINT sectors_name_key UNIQUE (name);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_name_key') THEN
        ALTER TABLE public.jobs ADD CONSTRAINT jobs_name_key UNIQUE (name);
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 4. Populate Tables (Using WHERE NOT EXISTS)
INSERT INTO public.sectors (name)
SELECT DISTINCT sector FROM public.profiles 
WHERE sector IS NOT NULL AND sector != ''
AND NOT EXISTS (SELECT 1 FROM public.sectors s WHERE s.name = public.profiles.sector);

INSERT INTO public.jobs (name)
SELECT DISTINCT job_title FROM public.profiles 
WHERE job_title IS NOT NULL AND job_title != ''
AND NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.name = public.profiles.job_title);

-- 5. Add Foreign Keys to 'profiles'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id);

-- 6. Migrate Data (Link Foreign Keys)
UPDATE public.profiles p
SET sector_id = s.id
FROM public.sectors s
WHERE p.sector = s.name AND p.sector_id IS NULL;

UPDATE public.profiles p
SET job_id = j.id
FROM public.jobs j
WHERE p.job_title = j.name AND p.job_id IS NULL;

-------------------------------------------------------------------------------
-- 2. INDEXING FOR PERFORMANCE
-------------------------------------------------------------------------------

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_sector_id ON public.profiles(sector_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Purchase Orders (Compras)
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON public.purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at_desc ON public.purchase_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_purchase_status ON public.purchase_orders(purchase_status);

-- Vehicles & Abastecimento
-- FIX: Abastecimentos table uses 'vehicle' (text) column, not 'vehicle_id'.
-- Indexing the text column for search performance.
CREATE INDEX IF NOT EXISTS idx_abastecimentos_vehicle ON public.abastecimentos(vehicle);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_date_desc ON public.abastecimentos(date DESC);

-------------------------------------------------------------------------------
-- 3. SECURITY (RLS POLICIES)
-------------------------------------------------------------------------------

-- 3.1 Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

CREATE POLICY "Enable read access for authenticated users" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for users based on id" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 3.2 Sectors & Jobs
DROP POLICY IF EXISTS "Read sectors" ON public.sectors;
DROP POLICY IF EXISTS "Admin insert sectors" ON public.sectors;
DROP POLICY IF EXISTS "Read jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin insert jobs" ON public.jobs;

CREATE POLICY "Read sectors" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert sectors" ON public.sectors FOR INSERT TO authenticated
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Read jobs" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert jobs" ON public.jobs FOR INSERT TO authenticated
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 3.3 Storage (Chat Attachments & Compras)
-- Handle Bucket Creation Safely
INSERT INTO storage.buckets (id, name, public)
SELECT 'chat-attachments', 'chat-attachments', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chat-attachments');

-- Storage Policies
DROP POLICY IF EXISTS "Allow Authenticated INSERT Compras" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated UPDATE Compras" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated SELECT Compras" ON storage.objects;

CREATE POLICY "Allow Authenticated INSERT Compras" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Allow Authenticated SELECT Compras" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Allow Authenticated UPDATE Compras" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-attachments');

-------------------------------------------------------------------------------
-- 4. FINAL VERIFICATION
-------------------------------------------------------------------------------
SELECT 
    (SELECT count(*) FROM public.sectors) as sectors_count,
    (SELECT count(*) FROM public.jobs) as jobs_count,
    (SELECT count(*) FROM public.profiles WHERE sector_id IS NOT NULL) as profiles_migrated;
