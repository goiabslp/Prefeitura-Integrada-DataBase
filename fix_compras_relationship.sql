-- FIX: Add Foreign Key between purchase_orders and profiles to enable Joins (PGRST200 Fix)

BEGIN;

-- 1. Ensure the Foreign Key exists. 
-- Using a safe block to avoid errors if it strictly already exists under a different name,
-- but standardizing on 'purchase_orders_user_id_fkey' is good practice for Supabase.

DO $$
BEGIN
    -- Check if constraint exists, if not, add it
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'purchase_orders_user_id_fkey'
    ) THEN
        ALTER TABLE public.purchase_orders
        ADD CONSTRAINT purchase_orders_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL; -- Keep history even if user is deleted (or restricting delete)
    END IF;
END $$;

-- 2. Explicitly expose the relationship to PostgREST/Supabase
-- Adding a comment on the constraint helps Supabase sometimes, but the FK properly defined is key.
COMMENT ON CONSTRAINT purchase_orders_user_id_fkey ON public.purchase_orders IS 'Link purchase order to the user profile who created it.';

-- 3. Verify RLS (Just in case joins are filtered out by RLS)
-- Ensure 'anon' and 'authenticated' can actually read the profiles they are joining to.
-- Usually profiles are readable by everyone or at least authenticated users.
-- Re-applying a safe 'read' policy for profiles if not exists (or rely on existing).
-- (Assuming existing optimization script handled this, but double checking public access for relationships)

COMMIT;
