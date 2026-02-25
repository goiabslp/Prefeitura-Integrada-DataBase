-- Migration: Add objectives column to projetos
-- Date: 2026-02-25

ALTER TABLE public.projetos 
ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]'::jsonb;

-- Update existing rows to have an empty array if null (though IF NOT EXISTS handles NEW columns)
UPDATE public.projetos SET objectives = '[]'::jsonb WHERE objectives IS NULL;
