
-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create Normalization Function
-- This function removes accents, converts to lowercase, and strips special characters.
CREATE OR REPLACE FUNCTION public.normalize_search_text(input_text text) 
RETURNS text AS $$
BEGIN
    -- Normalização robusta: transforma em minúsculo, remove acentos e limpa caracteres especiais
    RETURN trim(regexp_replace(lower(unaccent(COALESCE(input_text, ''))), '[^a-z0-9\s]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Add Searchable Column (Generated & Optimized)
-- Usando COALESCE no document_snapshot para evitar erros se o campo estiver nulo
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS search_index text 
GENERATED ALWAYS AS (
    normalize_search_text(protocol) || ' ' || 
    normalize_search_text(title) || ' ' || 
    normalize_search_text(user_name) || ' ' ||
    normalize_search_text(COALESCE(document_snapshot->'content'->>'requesterName', '')) || ' ' ||
    normalize_search_text(COALESCE(document_snapshot->'content'->>'requesterSector', ''))
) STORED;

-- 4. Create Trigram Index for High Performance Partial Matching (LIKE/ILIKE)
-- GIN Trigram index allows for very fast %search% queries even on large datasets.
CREATE INDEX IF NOT EXISTS idx_purchase_orders_full_search 
ON public.purchase_orders 
USING gin (search_index gin_trgm_ops);

-- 5. Refresh existing records (Optional if using GENERATED ALWAYS)
-- PostgREST/Postgres will automatically handle the generation.
