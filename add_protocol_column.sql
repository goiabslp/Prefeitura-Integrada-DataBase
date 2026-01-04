-- Add protocol column to abastecimentos table
ALTER TABLE public.abastecimentos 
ADD COLUMN IF NOT EXISTS protocol TEXT;

-- Optional: You can backfill existing records if you want, or leave them null
-- UPDATE public.abastecimentos SET protocol = 'ABA-' || substring(id::text, 1, 8) WHERE protocol IS NULL;
